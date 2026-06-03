const fs = require("node:fs")
const path = require("node:path")

const {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
} = require("@firebase/rules-unit-testing")
const {
	collectionGroup,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	setDoc,
	updateDoc,
} = require("firebase/firestore")

let testEnv

function authedDb(uid, token = {}) {
	return testEnv
		.authenticatedContext(uid, {
			email: `${uid}@example.com`,
			...token,
		})
		.firestore()
}

function publicDb() {
	return testEnv.unauthenticatedContext().firestore()
}

async function seedDoc(documentPath, data) {
	await testEnv.withSecurityRulesDisabled(async (context) => {
		await setDoc(doc(context.firestore(), documentPath), data)
	})
}

describe("Firestore security rules", () => {
	beforeAll(async () => {
		testEnv = await initializeTestEnvironment({
			projectId: "demo-salon-shop-tests",
			firestore: {
				rules: fs.readFileSync(
					path.resolve(__dirname, "..", "..", "firestore.rules"),
					"utf8",
				),
			},
		})
	})

	afterEach(async () => {
		await testEnv.clearFirestore()
	})

	afterAll(async () => {
		await testEnv.cleanup()
	})

	it("allows public content reads but blocks unauthenticated private booking reads", async () => {
		await seedDoc("galleryStyles/style-1", {
			name: "Box Braids",
			status: "published",
		})
		await seedDoc("bookings/booking-1", {
			uid: "client-a",
			email: "client-a@example.com",
			status: "pending",
		})

		await assertSucceeds(getDoc(doc(publicDb(), "galleryStyles/style-1")))
		await assertFails(getDoc(doc(publicDb(), "bookings/booking-1")))
	})

	it("allows signed-in clients to create their own booking and slot lock", async () => {
		const clientDb = authedDb("client-a")
		const bookingPayload = {
			firstName: "Client",
			lastName: "A",
			email: "client-a@example.com",
			phone: "+254700000001",
			service: "Knotless Braids",
			stylist: "Fatima Hassan",
			stylistKey: "fatima",
			date: "2099-01-15",
			time: "10:00 AM",
			slotId: "2099-01-15__fatima__1000AM",
			notes: "Rules test booking",
			inspirationImageUrl: "",
			status: "confirmed",
			uid: "client-a",
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		const slotPayload = {
			taken: true,
			date: "2099-01-15",
			time: "10:00 AM",
			stylistKey: "fatima",
			bookingId: "booking-allowed",
			uid: "client-a",
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		await assertSucceeds(
			setDoc(doc(clientDb, "bookings/booking-allowed"), bookingPayload),
		)
		await assertSucceeds(
			setDoc(
				doc(clientDb, "bookingSlots/2099-01-15__fatima__1000AM"),
				slotPayload,
			),
		)
	})

	it("blocks clients from creating bookings for another user", async () => {
		const clientDb = authedDb("client-a")

		await assertFails(
			setDoc(doc(clientDb, "bookings/booking-other-user"), {
				firstName: "Client",
				lastName: "A",
				email: "client-a@example.com",
				phone: "+254700000001",
				service: "Knotless Braids",
				stylist: "Fatima Hassan",
				stylistKey: "fatima",
				date: "2099-01-15",
				time: "10:00 AM",
				slotId: "2099-01-15__fatima__1000AM",
				notes: "Invalid owner",
				inspirationImageUrl: "",
				status: "confirmed",
				uid: "client-b",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
	})

	it("allows signed-in clients to create contact messages", async () => {
		const clientDb = authedDb("client-a")

		await assertSucceeds(
			setDoc(doc(clientDb, "contactMessages/message-1"), {
				name: "Client A",
				email: "client-a@example.com",
				subject: "Booking question",
				message: "Do you have availability tomorrow?",
				status: "new",
				uid: "client-a",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
	})

	it("enforces review and contact submission cooldown documents", async () => {
		await seedDoc("rateLimits/client-a", {
			reviewCooldownUntil: new Date(Date.now() + 60 * 60 * 1000),
			contactCooldownUntil: new Date(Date.now() + 60 * 60 * 1000),
		})

		const clientDb = authedDb("client-a")

		await assertFails(
			setDoc(doc(clientDb, "reviews/rate-limited-review"), {
				name: "Client A",
				text: "This valid review should be blocked by cooldown.",
				rating: 5,
				source: "Website",
				status: "pending",
				featured: false,
				adminReply: "",
				reportsCount: 0,
				uid: "client-a",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)

		await assertFails(
			setDoc(doc(clientDb, "contactMessages/rate-limited-contact"), {
				name: "Client A",
				email: "client-a@example.com",
				subject: "Cooldown check",
				message: "This valid message should be blocked by cooldown.",
				status: "new",
				uid: "client-a",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
	})

	it("allows users to create only their own profile document", async () => {
		const clientDb = authedDb("client-a")
		const validProfile = {
			displayName: "Client A",
			email: "client-a@example.com",
			provider: "password",
			phone: "+254700000000",
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		await assertSucceeds(setDoc(doc(clientDb, "users/client-a"), validProfile))
		await assertFails(setDoc(doc(clientDb, "users/client-b"), validProfile))
	})

	it("blocks direct client writes to server-managed admin records", async () => {
		await seedDoc("adminUsers/super-admin", {
			active: true,
			role: "super_admin",
			permissions: {
				canManageAdmins: true,
				canManageBookings: true,
				canManageContent: true,
				canManageSecurity: true,
			},
		})
		await seedDoc("adminUsers/existing-admin", {
			active: true,
			role: "admin",
			permissions: { canManageBookings: true },
		})

		const superAdminDb = authedDb("super-admin")

		await assertSucceeds(getDoc(doc(superAdminDb, "adminUsers/existing-admin")))
		await assertFails(
			setDoc(doc(superAdminDb, "adminUsers/new-admin"), {
				active: true,
				role: "admin",
				permissions: { canManageBookings: true },
			}),
		)
	})

	it("allows owners to cancel active bookings but blocks invalid owner status changes", async () => {
		await seedDoc("bookings/active-booking", {
			uid: "client-a",
			email: "client-a@example.com",
			status: "confirmed",
			date: "2099-05-01",
			time: "10:00 AM",
			slotId: "2099-05-01__fatima__1000AM",
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		await seedDoc("bookings/completed-booking", {
			uid: "client-a",
			email: "client-a@example.com",
			status: "completed",
			date: "2099-05-02",
			time: "11:00 AM",
			slotId: "2099-05-02__fatima__1100AM",
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		const ownerDb = authedDb("client-a")
		const otherClientDb = authedDb("client-b")

		await assertSucceeds(
			updateDoc(doc(ownerDb, "bookings/active-booking"), {
				status: "cancelled",
				uid: "client-a",
				updatedAt: new Date(),
			}),
		)
		await assertFails(
			updateDoc(doc(ownerDb, "bookings/completed-booking"), {
				status: "cancelled",
				uid: "client-a",
				updatedAt: new Date(),
			}),
		)
		await assertFails(
			updateDoc(doc(otherClientDb, "bookings/completed-booking"), {
				status: "cancelled",
				uid: "client-b",
				updatedAt: new Date(),
			}),
		)
	})

	it("allows booking admins to perform valid booking transitions only", async () => {
		await seedDoc("adminUsers/bookings-admin", {
			active: true,
			role: "admin",
			permissions: { canManageBookings: true },
		})
		await seedDoc("adminUsers/content-admin", {
			active: true,
			role: "admin",
			permissions: { canManageContent: true },
		})
		await seedDoc("bookings/admin-transition-booking", {
			uid: "client-a",
			email: "client-a@example.com",
			status: "pending",
			date: "2099-05-03",
			time: "12:00 PM",
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		const bookingsAdminDb = authedDb("bookings-admin")
		const contentAdminDb = authedDb("content-admin")

		await assertSucceeds(
			updateDoc(doc(bookingsAdminDb, "bookings/admin-transition-booking"), {
				status: "confirmed",
				updatedAt: new Date(),
			}),
		)
		await assertFails(
			updateDoc(doc(bookingsAdminDb, "bookings/admin-transition-booking"), {
				status: "pending",
				updatedAt: new Date(),
			}),
		)
		await assertFails(
			updateDoc(doc(contentAdminDb, "bookings/admin-transition-booking"), {
				status: "completed",
				updatedAt: new Date(),
			}),
		)
	})

	it("allows security admins, but not normal clients, to read security alerts", async () => {
		await seedDoc("adminUsers/security-admin", {
			active: true,
			role: "admin",
			permissions: { canManageSecurity: true },
		})
		await seedDoc("securityAlerts/alert-1", {
			severity: "high",
			status: "open",
			createdAt: new Date(),
		})

		await assertFails(
			getDoc(doc(authedDb("client-a"), "securityAlerts/alert-1")),
		)
		await assertSucceeds(
			getDoc(doc(authedDb("security-admin"), "securityAlerts/alert-1")),
		)
	})

	it("keeps login activity server-written while allowing owners to read their own history", async () => {
		await seedDoc("loginActivities/activity-1", {
			uid: "client-a",
			status: "success",
			createdAt: new Date(),
		})

		const clientDb = authedDb("client-a")

		await assertSucceeds(getDoc(doc(clientDb, "loginActivities/activity-1")))
		await assertFails(
			setDoc(doc(clientDb, "loginActivities/activity-2"), {
				uid: "client-a",
				status: "success",
				createdAt: new Date(),
			}),
		)
	})

	it("keeps booking slots publicly readable while protecting slot ownership deletes", async () => {
		await seedDoc("bookingSlots/slot-owner", {
			taken: true,
			date: "2099-05-04",
			time: "9:00 AM",
			stylistKey: "fatima",
			bookingId: "booking-owner",
			uid: "client-a",
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		await seedDoc("bookingSlots/slot-other", {
			taken: true,
			date: "2099-05-04",
			time: "10:00 AM",
			stylistKey: "fatima",
			bookingId: "booking-other",
			uid: "client-b",
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		await assertSucceeds(getDoc(doc(publicDb(), "bookingSlots/slot-owner")))
		await assertFails(
			deleteDoc(doc(authedDb("client-a"), "bookingSlots/slot-other")),
		)
		await assertSucceeds(
			deleteDoc(doc(authedDb("client-a"), "bookingSlots/slot-owner")),
		)
	})

	it("enforces waitlist create/read/update boundaries for owners and admins", async () => {
		const waitlistPayload = {
			firstName: "Client",
			lastName: "A",
			email: "client-a@example.com",
			phone: "+254700000100",
			service: "Knotless Braids",
			stylist: "Fatima Hassan",
			stylistKey: "fatima",
			preferredDate: "2099-01-20",
			preferredTime: "10:00 AM",
			preferredSlotId: "2099-01-20__fatima__1000AM",
			notes: "Prefer morning",
			inspirationImageUrl: "",
			status: "waiting",
			notifiedAt: null,
			uid: "client-a",
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		await seedDoc("adminUsers/bookings-admin", {
			active: true,
			role: "admin",
			permissions: { canManageBookings: true },
		})

		const ownerDb = authedDb("client-a")
		const otherClientDb = authedDb("client-b")
		const bookingsAdminDb = authedDb("bookings-admin")

		await assertSucceeds(
			setDoc(doc(ownerDb, "waitlist/wait-1"), waitlistPayload),
		)
		await assertSucceeds(getDoc(doc(ownerDb, "waitlist/wait-1")))
		await assertFails(getDoc(doc(otherClientDb, "waitlist/wait-1")))
		await assertSucceeds(getDoc(doc(bookingsAdminDb, "waitlist/wait-1")))

		await assertFails(
			updateDoc(doc(otherClientDb, "waitlist/wait-1"), {
				status: "cancelled",
				updatedAt: new Date(),
			}),
		)

		await assertSucceeds(
			updateDoc(doc(ownerDb, "waitlist/wait-1"), {
				status: "cancelled",
				updatedAt: new Date(),
			}),
		)
	})

	it("allows booking admins to sync waitlist metadata onto linked bookings", async () => {
		await seedDoc("adminUsers/bookings-admin", {
			active: true,
			role: "admin",
			permissions: { canManageBookings: true },
		})
		await seedDoc("adminUsers/content-admin", {
			active: true,
			role: "admin",
			permissions: { canManageContent: true },
		})
		await seedDoc("bookings/waitlisted-booking", {
			uid: "client-a",
			email: "client-a@example.com",
			status: "waitlisted",
			waitlistId: "wait-1",
			bookingType: "waitlist",
			isWaitlisted: true,
			waitlistStatus: "waiting",
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		const bookingsAdminDb = authedDb("bookings-admin")
		const contentAdminDb = authedDb("content-admin")
		const ownerDb = authedDb("client-a")

		await assertFails(
			updateDoc(doc(ownerDb, "bookings/waitlisted-booking"), {
				waitlistStatus: "contacted",
				updatedAt: new Date(),
			}),
		)
		await assertFails(
			updateDoc(doc(contentAdminDb, "bookings/waitlisted-booking"), {
				waitlistStatus: "contacted",
				waitlistAdminUpdatedBy: "content-admin@example.com",
				waitlistUpdatedAt: new Date(),
				updatedAt: new Date(),
			}),
		)
		await assertSucceeds(
			updateDoc(doc(bookingsAdminDb, "bookings/waitlisted-booking"), {
				status: "waitlisted",
				bookingType: "waitlist",
				isWaitlisted: true,
				waitlistStatus: "contacted",
				waitlistAdminUpdatedBy: "bookings-admin@example.com",
				waitlistUpdatedAt: new Date(),
				updatedAt: new Date(),
			}),
		)
		await assertSucceeds(
			updateDoc(doc(bookingsAdminDb, "bookings/waitlisted-booking"), {
				status: "cancelled",
				isWaitlisted: false,
				waitlistStatus: "cancelled",
				waitlistAdminUpdatedBy: "bookings-admin@example.com",
				waitlistUpdatedAt: new Date(),
				cancelledAt: new Date(),
				cancelledBy: "bookings-admin@example.com",
				updatedAt: new Date(),
			}),
		)
	})

	it("enforces reviews visibility and write restrictions for public/users/admin", async () => {
		await seedDoc("reviews/review-approved", {
			name: "Approved Reviewer",
			text: "Amazing service and clean salon.",
			rating: 5,
			source: "Website",
			status: "approved",
			featured: true,
			adminReply: "Thanks!",
			reportsCount: 0,
			uid: "client-a",
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		await seedDoc("reviews/review-pending", {
			name: "Pending Reviewer",
			text: "Pending moderation text here.",
			rating: 4,
			source: "Website",
			status: "pending",
			featured: false,
			adminReply: "",
			reportsCount: 0,
			uid: "client-a",
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		await seedDoc("adminUsers/content-admin", {
			active: true,
			role: "admin",
			permissions: { canManageContent: true },
		})

		await assertSucceeds(getDoc(doc(publicDb(), "reviews/review-approved")))
		await assertFails(getDoc(doc(publicDb(), "reviews/review-pending")))
		await assertSucceeds(
			getDoc(doc(authedDb("client-a"), "reviews/review-pending")),
		)
		await assertFails(
			getDoc(doc(authedDb("client-b"), "reviews/review-pending")),
		)
		await assertSucceeds(
			getDoc(doc(authedDb("content-admin"), "reviews/review-pending")),
		)

		await assertSucceeds(
			setDoc(doc(authedDb("client-c"), "reviews/review-new"), {
				name: "Client C",
				text: "This is a genuinely positive review text.",
				rating: 5,
				source: "Website",
				status: "pending",
				featured: false,
				adminReply: "",
				reportsCount: 0,
				uid: "client-c",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)

		await assertFails(
			setDoc(doc(authedDb("client-c"), "reviews/review-invalid"), {
				name: "Client C",
				text: "Trying to self-approve should fail.",
				rating: 5,
				source: "Website",
				status: "approved",
				featured: true,
				adminReply: "",
				reportsCount: 0,
				uid: "client-c",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
	})

	it("keeps favorites private per user while allowing owner CRUD", async () => {
		const ownerDb = authedDb("client-a")

		await assertSucceeds(
			setDoc(doc(ownerDb, "users/client-a/favorites/fav-1"), {
				id: "style-1",
				styleName: "Knotless Braids",
				styleType: "Braids",
				stylistName: "Fatima Hassan",
				imageUrl: "https://example.com/style.jpg",
				savedAt: new Date(),
			}),
		)

		await assertSucceeds(getDoc(doc(ownerDb, "users/client-a/favorites/fav-1")))
		await assertFails(
			getDoc(doc(authedDb("client-b"), "users/client-a/favorites/fav-1")),
		)
	})

	it("allows content admins to manage public content and contact statuses", async () => {
		await seedDoc("adminUsers/content-admin", {
			active: true,
			role: "admin",
			permissions: { canManageContent: true },
		})
		await seedDoc("contactMessages/message-1", {
			name: "Client A",
			email: "client-a@example.com",
			subject: "Question",
			message: "Can I book tomorrow?",
			status: "new",
			uid: "client-a",
			createdAt: new Date(),
			updatedAt: new Date(),
		})

		const contentAdminDb = authedDb("content-admin")
		const clientDb = authedDb("client-a")

		await assertSucceeds(
			setDoc(doc(contentAdminDb, "galleryStyles/style-admin"), {
				styleName: "Admin Style",
				status: "published",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
		await assertSucceeds(
			setDoc(doc(contentAdminDb, "blogs/blog-admin"), {
				title: "Admin Blog",
				excerpt: "Admin-managed content",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
		await assertSucceeds(
			updateDoc(doc(contentAdminDb, "contactMessages/message-1"), {
				status: "read",
				updatedAt: new Date(),
			}),
		)
		await assertFails(
			setDoc(doc(clientDb, "galleryStyles/client-style"), {
				styleName: "Client Style",
			}),
		)
		await assertFails(getDoc(doc(clientDb, "contactMessages/message-1")))
	})

	it("enforces user session ownership and collection-group security visibility", async () => {
		await seedDoc("adminUsers/security-admin", {
			active: true,
			role: "admin",
			permissions: { canManageSecurity: true },
		})

		const ownerDb = authedDb("client-a")
		const otherClientDb = authedDb("client-b")
		const securityAdminDb = authedDb("security-admin")

		await assertSucceeds(
			setDoc(doc(ownerDb, "userSessions/client-a/sessions/session-1"), {
				uid: "client-a",
				status: "online",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
		await assertFails(
			setDoc(doc(otherClientDb, "userSessions/client-a/sessions/session-2"), {
				uid: "client-a",
				status: "online",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
		await assertSucceeds(
			getDoc(doc(ownerDb, "userSessions/client-a/sessions/session-1")),
		)
		await assertFails(
			getDocs(collectionGroup(ownerDb, "sessions")),
		)
		await assertSucceeds(
			getDocs(collectionGroup(securityAdminDb, "sessions")),
		)
	})

	it("blocks public waitlist and review creation for unauthenticated users", async () => {
		await assertFails(
			setDoc(doc(publicDb(), "waitlist/public-wait"), {
				firstName: "Guest",
				lastName: "User",
				email: "guest@example.com",
				phone: "+254700000999",
				service: "Knotless Braids",
				stylist: "Fatima Hassan",
				stylistKey: "fatima",
				preferredDate: "2099-02-01",
				preferredTime: "10:00 AM",
				preferredSlotId: "2099-02-01__fatima__1000AM",
				notes: "Public should fail",
				inspirationImageUrl: "",
				status: "waiting",
				notifiedAt: null,
				uid: "guest",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)

		await assertFails(
			setDoc(doc(publicDb(), "reviews/public-review"), {
				name: "Guest",
				text: "Guest review should not be accepted.",
				rating: 5,
				source: "Website",
				status: "pending",
				featured: false,
				adminReply: "",
				reportsCount: 0,
				uid: "guest",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		)
	})
})
