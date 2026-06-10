//<!-- ========== JAVASCRIPT ========== -->

// ============ DATA ============
const clientConfig = window.CLIENT_CONFIG || {}
const clientCatalog = clientConfig.catalog || {}

function getClientCatalogArray(key = "") {
	const value = clientCatalog?.[key]
	return Array.isArray(value) ? value : []
}

function slugifyConfigKey(value = "") {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

function normalizeClientCatalogServiceCategory(item = {}) {
	const source =
		typeof item === "object" && item && !Array.isArray(item)
			? item
			: { label: String(item || "") }
	const label = String(source.label || source.name || "").trim()
	const key = slugifyConfigKey(source.key || source.id || source.slug || label)
	if (!key || !label) return null
	return {
		...source,
		key,
		label,
		shortLabel: String(source.shortLabel || source.shortName || label).trim(),
		galleryLabel: String(
			source.galleryLabel || source.galleryName || source.shortLabel || label,
		).trim(),
	}
}

function getClientCatalogServiceCategories(fallbackCategories = []) {
	const configuredCategories = getClientCatalogArray("serviceCategories")
		.map((item) => normalizeClientCatalogServiceCategory(item))
		.filter(Boolean)
	return configuredCategories.length
		? configuredCategories
		: fallbackCategories
				.map((item) => normalizeClientCatalogServiceCategory(item))
				.filter(Boolean)
}

function normalizeClientCatalogServiceRecord(service = {}) {
	const source =
		typeof service === "object" && service && !Array.isArray(service)
			? service
			: { name: String(service || "") }
	const name = String(
		source.name || source.serviceName || source.title || "",
	).trim()
	if (!name) return null
	return {
		...source,
		name,
		desc: String(source.desc || source.description || "").trim(),
		price: String(
			source.price || source.amount || source.serviceAmount || "",
		).trim(),
		duration: String(source.duration || source.time || "").trim(),
		icon: String(source.icon || "scissors").trim() || "scissors",
		category:
			String(
				source.category ||
					source.categoryKey ||
					source.serviceCategory ||
					"braids-services",
			).trim() || "braids-services",
		categoryLabel: String(source.categoryLabel || "").trim(),
		subServices: Array.isArray(source.subServices)
			? source.subServices
					.map((item) => normalizeClientCatalogSubServiceRecord(item))
					.filter(Boolean)
			: [],
	}
}

function normalizeClientCatalogSubServiceRecord(subService = {}) {
	const source =
		typeof subService === "object" && subService && !Array.isArray(subService)
			? subService
			: { name: String(subService || "") }
	const name = String(
		source.name || source.serviceName || source.title || "",
	).trim()
	if (!name) return null
	return {
		...source,
		name,
		desc: String(source.desc || source.description || "").trim(),
		price: String(
			source.price || source.amount || source.serviceAmount || "",
		).trim(),
		duration: String(source.duration || source.time || "").trim(),
	}
}

function buildStylistLabel(name = "", title = "", fallbackLabel = "") {
	const safeLabel = String(fallbackLabel || "").trim()
	if (safeLabel) return safeLabel
	const safeName = String(name || "").trim()
	const safeTitle = String(title || "").trim()
	if (safeName && safeTitle) return `${safeName} - ${safeTitle}`
	return safeName || safeTitle
}

function normalizeClientCatalogStylist(item = {}) {
	const source =
		typeof item === "object" && item && !Array.isArray(item)
			? item
			: { name: String(item || "") }
	const name = String(
		source.name || source.displayName || source.label || "",
	).trim()
	const title = String(
		source.title || source.role || source.specialty || "",
	).trim()
	const label = buildStylistLabel(name, title, source.label)
	const key = slugifyConfigKey(
		source.key || source.id || source.slug || name || label,
	)
	if (!key || !label) return null
	return {
		...source,
		key,
		name: name || label,
		title,
		label,
		aliases: Array.isArray(source.aliases) ? source.aliases : [],
	}
}

function getClientCatalogStylists(fallbackStylists = []) {
	const configuredStylists = getClientCatalogArray("stylists")
		.map((item) => normalizeClientCatalogStylist(item))
		.filter(Boolean)
	return configuredStylists.length
		? configuredStylists
		: fallbackStylists
				.map((item) => normalizeClientCatalogStylist(item))
				.filter(Boolean)
}

const fallbackServiceCategoryDefinitions = [
	{
		key: "braids-services",
		label: "Braids Services",
		shortLabel: "Braids",
		galleryLabel: "Braids",
	},
	{
		key: "hair-services",
		label: "Hair Services",
		shortLabel: "Hair",
		galleryLabel: "Hair",
	},
	{
		key: "beauty-spa-services",
		label: "Beauty Spa Services",
		shortLabel: "Beauty Spa",
		galleryLabel: "Beauty Spa",
	},
	{
		key: "nail-services",
		label: "Nail Services",
		shortLabel: "Nails",
		galleryLabel: "Nails",
	},
	{
		key: "makeup-services",
		label: "Makeup Services",
		shortLabel: "Makeup",
		galleryLabel: "Makeup",
	},
	{
		key: "barber-services",
		label: "Barber Services",
		shortLabel: "Barber",
		galleryLabel: "Barber",
	},
	{
		key: "massage-wellness",
		label: "Massage & Wellness",
		shortLabel: "Massage",
		galleryLabel: "Massage",
	},
	{
		key: "eyebrow-lash-services",
		label: "Eyebrow & Lash Services",
		shortLabel: "Eyebrows & Lash",
		galleryLabel: "Eyebrows & Lash",
	},
	{
		key: "bridal-event-packages",
		label: "Bridal / Event Packages",
		shortLabel: "Bridal / Events",
		galleryLabel: "Bridal / Event Packages",
	},
]

const clientServiceCategoryDefinitions = getClientCatalogServiceCategories(
	fallbackServiceCategoryDefinitions,
)

const fallbackStylistDefinitions = [
	{ key: "fatima", name: "Fatima Hassan", title: "Master Braider" },
	{ key: "zainab", name: "Zainab Mohamed", title: "Senior Stylist" },
	{ key: "grace", name: "Grace Wanjiku", title: "Natural Hair Expert" },
	{ key: "amina", name: "Amina Diallo", title: "Braiding Specialist" },
	{ key: "sarah", name: "Sarah Omondi", title: "Kids Specialist" },
]

const clientStylistDefinitions = getClientCatalogStylists(
	fallbackStylistDefinitions,
)

const fallbackServicesData = [
	// Braids Services
	{
		name: "Hair Braiding",
		desc: "Professional protective braiding tailored to your preferred look.",
		price: "From KSh 3,000",
		duration: "2-5 hrs",
		icon: "scissors",
		category: "braids-services",
		categoryLabel: "Braids Services",
	},
	{
		name: "Box Braids",
		desc: "Classic sectioned braids for a neat, long-lasting protective style.",
		price: "From KSh 3,500",
		duration: "3-5 hrs",
		icon: "scissors",
		category: "braids-services",
		categoryLabel: "Braids Services",
	},
	{
		name: "Knotless Braids",
		desc: "Lightweight knot-free braids with less tension on the scalp.",
		price: "From KSh 4,500",
		duration: "4-6 hrs",
		icon: "scissors",
		category: "braids-services",
		categoryLabel: "Braids Services",
	},
	{
		name: "Cornrows",
		desc: "Clean scalp braids in classic straight-back or custom patterns.",
		price: "From KSh 1,500",
		duration: "1-3 hrs",
		icon: "heart",
		category: "braids-services",
		categoryLabel: "Braids Services",
	},
	{
		name: "Fulani Braids",
		desc: "Signature center-parted braids with stylish side detailing.",
		price: "From KSh 4,000",
		duration: "3-5 hrs",
		icon: "crown",
		category: "braids-services",
		categoryLabel: "Braids Services",
	},
	{
		name: "Stitch Braids",
		desc: "Precise feed-in braids with crisp stitch-like parting lines.",
		price: "From KSh 2,500",
		duration: "2-4 hrs",
		icon: "heart",
		category: "braids-services",
		categoryLabel: "Braids Services",
	},
	{
		name: "Faux Locs",
		desc: "Trendy loc-inspired protective style with natural movement.",
		price: "From KSh 4,500",
		duration: "4-6 hrs",
		icon: "feather",
		category: "braids-services",
		categoryLabel: "Braids Services",
	},

	// Hair Services
	{
		name: "Hair Styling",
		desc: "Finish and style your hair for daily elegance or special events.",
		price: "From KSh 1,500",
		duration: "45-90 mins",
		icon: "crown",
		category: "hair-services",
		categoryLabel: "Hair Services",
	},
	{
		name: "Hair Cutting",
		desc: "Precision cuts for a polished, healthy shape and finish.",
		price: "From KSh 1,200",
		duration: "30-60 mins",
		icon: "scissors",
		category: "hair-services",
		categoryLabel: "Hair Services",
	},
	{
		name: "Hair Coloring",
		desc: "Custom coloring, toning, and touch-ups for vibrant results.",
		price: "From KSh 3,500",
		duration: "2-3 hrs",
		icon: "droplet",
		category: "hair-services",
		categoryLabel: "Hair Services",
	},
	{
		name: "Hair Relaxing",
		desc: "Chemical relaxing service for smooth, manageable hair texture.",
		price: "From KSh 2,800",
		duration: "1.5-2 hrs",
		icon: "droplet",
		category: "hair-services",
		categoryLabel: "Hair Services",
	},
	{
		name: "Hair Treatment",
		desc: "Moisture and repair treatments to restore hair strength and shine.",
		price: "From KSh 2,000",
		duration: "1-1.5 hrs",
		icon: "droplet",
		category: "hair-services",
		categoryLabel: "Hair Services",
	},
	{
		name: "Wig Installation",
		desc: "Secure and natural-looking wig installation with perfect blending.",
		price: "From KSh 3,000",
		duration: "1.5-2.5 hrs",
		icon: "crown",
		category: "hair-services",
		categoryLabel: "Hair Services",
	},
	{
		name: "Weaving/Extensions",
		desc: "Professional install of weaves and extensions for added volume.",
		price: "From KSh 3,500",
		duration: "2-4 hrs",
		icon: "feather",
		category: "hair-services",
		categoryLabel: "Hair Services",
	},
	{
		name: "Hair Washing & Blow Dry",
		desc: "Deep cleanse and smooth blow-dry finish for refreshed hair.",
		price: "From KSh 1,500",
		duration: "45-75 mins",
		icon: "droplet",
		category: "hair-services",
		categoryLabel: "Hair Services",
	},

	// Beauty Spa Services
	{
		name: "Facials",
		desc: "Glow-boosting facial care customized to your skin type.",
		price: "From KSh 2,500",
		duration: "60 mins",
		icon: "heart",
		category: "beauty-spa-services",
		categoryLabel: "Beauty Spa Services",
	},
	{
		name: "Body Scrubs",
		desc: "Exfoliating body treatments for softer, brighter skin.",
		price: "From KSh 3,000",
		duration: "60-75 mins",
		icon: "heart",
		category: "beauty-spa-services",
		categoryLabel: "Beauty Spa Services",
	},
	{
		name: "Steam Therapy",
		desc: "Relaxing steam sessions to open pores and release tension.",
		price: "From KSh 2,000",
		duration: "30-45 mins",
		icon: "feather",
		category: "beauty-spa-services",
		categoryLabel: "Beauty Spa Services",
	},
	{
		name: "Skin Treatments",
		desc: "Targeted professional treatment for specific skin concerns.",
		price: "From KSh 3,500",
		duration: "60-90 mins",
		icon: "droplet",
		category: "beauty-spa-services",
		categoryLabel: "Beauty Spa Services",
	},
	{
		name: "Sauna",
		desc: "Detoxifying sauna therapy for wellness and improved circulation.",
		price: "From KSh 2,000",
		duration: "30-45 mins",
		icon: "feather",
		category: "beauty-spa-services",
		categoryLabel: "Beauty Spa Services",
	},
	{
		name: "Body Polishing",
		desc: "Full-body polish for smoother texture and radiant finish.",
		price: "From KSh 3,800",
		duration: "75 mins",
		icon: "heart",
		category: "beauty-spa-services",
		categoryLabel: "Beauty Spa Services",
	},
	{
		name: "Acne Treatment",
		desc: "Clarifying care to reduce breakouts and calm inflammation.",
		price: "From KSh 3,200",
		duration: "60 mins",
		icon: "droplet",
		category: "beauty-spa-services",
		categoryLabel: "Beauty Spa Services",
	},
	{
		name: "Skin Brightening",
		desc: "Tone-evening treatment to enhance natural skin radiance.",
		price: "From KSh 3,500",
		duration: "60 mins",
		icon: "gift",
		category: "beauty-spa-services",
		categoryLabel: "Beauty Spa Services",
	},

	// Nail Services
	{
		name: "Manicure",
		desc: "Classic manicure for clean, polished, healthy-looking nails.",
		price: "From KSh 1,200",
		duration: "45 mins",
		icon: "heart",
		category: "nail-services",
		categoryLabel: "Nail Services",
	},
	{
		name: "Pedicure",
		desc: "Foot care and nail grooming for comfort and beauty.",
		price: "From KSh 1,500",
		duration: "60 mins",
		icon: "heart",
		category: "nail-services",
		categoryLabel: "Nail Services",
	},
	{
		name: "Gel Polish",
		desc: "High-shine long-wear gel finish with rich color options.",
		price: "From KSh 1,800",
		duration: "45-60 mins",
		icon: "gift",
		category: "nail-services",
		categoryLabel: "Nail Services",
	},
	{
		name: "Acrylic Nails",
		desc: "Custom acrylic extensions for durable shape and length.",
		price: "From KSh 2,500",
		duration: "75-90 mins",
		icon: "crown",
		category: "nail-services",
		categoryLabel: "Nail Services",
	},
	{
		name: "Nail Art",
		desc: "Creative nail designs, accents, and event-ready detailing.",
		price: "From KSh 2,000",
		duration: "60-90 mins",
		icon: "gift",
		category: "nail-services",
		categoryLabel: "Nail Services",
	},
	{
		name: "Nail Repair",
		desc: "Fix broken, chipped, or lifted nails with expert repair care.",
		price: "From KSh 800",
		duration: "30-45 mins",
		icon: "heart",
		category: "nail-services",
		categoryLabel: "Nail Services",
	},

	// Makeup Services
	{
		name: "Bridal Makeup",
		desc: "Premium long-wear bridal glam with trial and customization.",
		price: "From KSh 8,000",
		duration: "2-3 hrs",
		icon: "crown",
		category: "makeup-services",
		categoryLabel: "Makeup Services",
	},
	{
		name: "Party Makeup",
		desc: "Event-ready makeup with flawless finish and photo-ready look.",
		price: "From KSh 3,500",
		duration: "75-90 mins",
		icon: "gift",
		category: "makeup-services",
		categoryLabel: "Makeup Services",
	},
	{
		name: "Photoshoot Makeup",
		desc: "Camera-optimized makeup designed for studio and outdoor shoots.",
		price: "From KSh 4,500",
		duration: "90-120 mins",
		icon: "crown",
		category: "makeup-services",
		categoryLabel: "Makeup Services",
	},
	{
		name: "Everyday Makeup",
		desc: "Soft, natural everyday glam for work and casual outings.",
		price: "From KSh 2,500",
		duration: "45-60 mins",
		icon: "heart",
		category: "makeup-services",
		categoryLabel: "Makeup Services",
	},
	{
		name: "Eyelash Installation",
		desc: "Precision lash application for fuller, defined eye looks.",
		price: "From KSh 1,800",
		duration: "45-60 mins",
		icon: "feather",
		category: "makeup-services",
		categoryLabel: "Makeup Services",
	},

	// Barber Services
	{
		name: "Haircuts",
		desc: "Modern and classic cuts tailored for men and boys.",
		price: "From KSh 800",
		duration: "30-45 mins",
		icon: "scissors",
		category: "barber-services",
		categoryLabel: "Barber Services",
	},
	{
		name: "Beard Grooming",
		desc: "Shape, trim, and style your beard for a clean finish.",
		price: "From KSh 700",
		duration: "20-30 mins",
		icon: "scissors",
		category: "barber-services",
		categoryLabel: "Barber Services",
	},
	{
		name: "Hair Dye",
		desc: "Color refresh and grey coverage tailored to your preference.",
		price: "From KSh 1,500",
		duration: "45-60 mins",
		icon: "droplet",
		category: "barber-services",
		categoryLabel: "Barber Services",
	},
	{
		name: "Kids Haircuts",
		desc: "Comfort-first grooming for children in a friendly setup.",
		price: "From KSh 600",
		duration: "20-30 mins",
		icon: "smile",
		category: "barber-services",
		categoryLabel: "Barber Services",
	},
	{
		name: "Lineups/Fades",
		desc: "Sharp lineups and clean fade transitions done professionally.",
		price: "From KSh 900",
		duration: "30-40 mins",
		icon: "scissors",
		category: "barber-services",
		categoryLabel: "Barber Services",
	},

	// Massage & Wellness
	{
		name: "Full Body Massage",
		desc: "Relaxing full-body massage to release stress and fatigue.",
		price: "From KSh 4,000",
		duration: "60-90 mins",
		icon: "heart",
		category: "massage-wellness",
		categoryLabel: "Massage & Wellness",
	},
	{
		name: "Deep Tissue Massage",
		desc: "Targeted pressure massage for deep muscle relief.",
		price: "From KSh 4,500",
		duration: "60-90 mins",
		icon: "heart",
		category: "massage-wellness",
		categoryLabel: "Massage & Wellness",
	},
	{
		name: "Hot Stone Massage",
		desc: "Warm stone therapy to ease tension and improve circulation.",
		price: "From KSh 5,000",
		duration: "75-90 mins",
		icon: "gift",
		category: "massage-wellness",
		categoryLabel: "Massage & Wellness",
	},
	{
		name: "Neck & Shoulder Massage",
		desc: "Focused relief for upper body stiffness and posture stress.",
		price: "From KSh 2,500",
		duration: "30-45 mins",
		icon: "heart",
		category: "massage-wellness",
		categoryLabel: "Massage & Wellness",
	},

	// Eyebrow & Lash Services
	{
		name: "Eyebrow Shaping",
		desc: "Defined brow shaping to complement your face and style.",
		price: "From KSh 900",
		duration: "20-30 mins",
		icon: "heart",
		category: "eyebrow-lash-services",
		categoryLabel: "Eyebrow & Lash Services",
	},
	{
		name: "Eyebrow Tinting",
		desc: "Tint enhancement for fuller, naturally defined brows.",
		price: "From KSh 1,200",
		duration: "20-30 mins",
		icon: "droplet",
		category: "eyebrow-lash-services",
		categoryLabel: "Eyebrow & Lash Services",
	},
	{
		name: "Eyelash Extension",
		desc: "Classic or volume lash extension application by experts.",
		price: "From KSh 2,800",
		duration: "90-120 mins",
		icon: "feather",
		category: "eyebrow-lash-services",
		categoryLabel: "Eyebrow & Lash Services",
	},
	{
		name: "Lash Lift",
		desc: "Lift and curl natural lashes for a longer-looking effect.",
		price: "From KSh 2,200",
		duration: "45-60 mins",
		icon: "feather",
		category: "eyebrow-lash-services",
		categoryLabel: "Eyebrow & Lash Services",
	},

	// Bridal / Event Packages
	{
		name: "Bridal Hair + Makeup",
		desc: "Complete bridal glam with coordinated hair and makeup artistry.",
		price: "From KSh 12,000",
		duration: "3-4 hrs",
		icon: "crown",
		category: "bridal-event-packages",
		categoryLabel: "Bridal / Event Packages",
	},
	{
		name: "Wedding Beauty Packages",
		desc: "Custom beauty bundle packages for brides and bridal teams.",
		price: "From KSh 20,000",
		duration: "Half day",
		icon: "gift",
		category: "bridal-event-packages",
		categoryLabel: "Bridal / Event Packages",
	},
	{
		name: "Graduation Package",
		desc: "Hair, makeup, and finishing touches for graduation celebrations.",
		price: "From KSh 7,500",
		duration: "2-3 hrs",
		icon: "gift",
		category: "bridal-event-packages",
		categoryLabel: "Bridal / Event Packages",
	},
	{
		name: "Photoshoot Package",
		desc: "Styled hair and makeup package tailored for photo sessions.",
		price: "From KSh 8,500",
		duration: "2-3 hrs",
		icon: "crown",
		category: "bridal-event-packages",
		categoryLabel: "Bridal / Event Packages",
	},
]

const configuredServicesData = getClientCatalogArray("services")
	.map((service) => normalizeClientCatalogServiceRecord(service))
	.filter(Boolean)
const servicesData = configuredServicesData.length
	? configuredServicesData
	: fallbackServicesData

const fallbackGalleryData = [
	{
		imageUrl: "IMG/box-braids-hairstyles-1x1-1.jpg",
		styleName: "Box Braids",
		styleType: "Classic Box",
		stylistName: "Fatima Hassan",
		length: "Medium",
		size: "Medium",
		timeTaken: "4 hours",
		priceRange: "KSh 3,500 - 5,000",
		hairType: "18-inch synthetic blend",
		featuredTrending: true,
		featuredMostBooked: true,
	},
	{
		imageUrl: "IMG/knotless braids.jpg",
		beforeImageUrl: "IMG/keeping box braids.jpg",
		hasBeforeAfter: true,
		styleName: "Knotless Braids",
		styleType: "Knotless",
		stylistName: "Zainab Mohamed",
		length: "Long",
		size: "Small",
		timeTaken: "5 hours",
		priceRange: "KSh 4,500 - 6,500",
		hairType: "22-inch human blend",
		featuredTrending: true,
	},
	{
		imageUrl: "IMG/black-cornrows.webp",
		styleName: "Cornrows Design",
		styleType: "Cornrows",
		stylistName: "Grace Wanjiku",
		length: "Short",
		size: "Medium",
		timeTaken: "2 hours",
		priceRange: "KSh 2,000 - 3,000",
		hairType: "Natural hair",
	},
	{
		imageUrl: "IMG/fulan-braids.jpg",
		styleName: "Fulani Braids",
		styleType: "Fulani",
		stylistName: "Amina Diallo",
		length: "Long",
		size: "Small",
		timeTaken: "4 hours",
		priceRange: "KSh 4,000 - 5,500",
		hairType: "20-inch synthetic blend",
		featuredMostBooked: true,
	},
	{
		imageUrl: "IMG/Senegalese_Twist.webp",
		styleName: "Senegalese Twists",
		styleType: "Twists",
		stylistName: "Fatima Hassan",
		length: "Long",
		size: "Medium",
		timeTaken: "4.5 hours",
		priceRange: "KSh 4,000 - 6,000",
		hairType: "24-inch twist fiber",
	},
	{
		imageUrl: "IMG/passion-twists.webp",
		beforeImageUrl: "IMG/natural hair care.webp",
		hasBeforeAfter: true,
		styleName: "Passion Twists",
		styleType: "Twists",
		stylistName: "Zainab Mohamed",
		length: "Medium",
		size: "Large",
		timeTaken: "3.5 hours",
		priceRange: "KSh 3,800 - 5,000",
		hairType: "Boho curl fiber",
	},
	{
		imageUrl: "IMG/goddess-braids.webp",
		styleName: "Goddess Braids",
		styleType: "Goddess",
		stylistName: "Grace Wanjiku",
		length: "Long",
		size: "Large",
		timeTaken: "3 hours",
		priceRange: "KSh 3,000 - 4,500",
		hairType: "20-inch fiber",
	},
	{
		imageUrl: "IMG/Lemonade_Braids.webp",
		styleName: "Lemonade Braids",
		styleType: "Side Cornrows",
		stylistName: "Amina Diallo",
		length: "Medium",
		size: "Small",
		timeTaken: "2.5 hours",
		priceRange: "KSh 2,500 - 3,800",
		hairType: "16-inch synthetic blend",
		featuredTrending: true,
	},
	{
		imageUrl: "IMG/braiding trends.jpg",
		styleName: "Braiding Trends",
		styleType: "Creative Mix",
		stylistName: "Fatima Hassan",
		length: "Medium",
		size: "Medium",
		timeTaken: "3 hours",
		priceRange: "KSh 3,000 - 4,500",
		hairType: "Mixed extensions",
	},
	{
		imageUrl: "IMG/keeping box braids.jpg",
		styleName: "Box Braids Care",
		styleType: "Maintenance",
		stylistName: "Zainab Mohamed",
		length: "Medium",
		size: "Small",
		timeTaken: "1.5 hours",
		priceRange: "KSh 1,500 - 2,500",
		hairType: "Retouch service",
	},
	{
		imageUrl: "IMG/natural hair care.webp",
		styleName: "Natural Hair Care",
		styleType: "Protective Prep",
		stylistName: "Grace Wanjiku",
		length: "Short",
		size: "Medium",
		timeTaken: "2 hours",
		priceRange: "KSh 2,000 - 3,000",
		hairType: "Natural afro texture",
	},
	{
		imageUrl: "IMG/twist-braids.jpg",
		styleName: "Twist Braids",
		styleType: "Two Strand Twists",
		stylistName: "Amina Diallo",
		length: "Long",
		size: "Medium",
		timeTaken: "4 hours",
		priceRange: "KSh 3,500 - 5,000",
		hairType: "22-inch twist fiber",
		featuredMostBooked: true,
	},
]

let galleryData = [...fallbackGalleryData]
let filteredGalleryData = [...galleryData]
let showAllGallery = false
let currentLightboxIndex = 0
let galleryRealtimeUnsubscribe = null
let dashboardFavoritesUnsubscribe = null
let dashboardBookingsUnsubscribe = null
let dashboardFavoriteStyles = []
let activeDashboardUid = ""
let activeDashboardBookingsKey = ""
let dashboardBookingDocs = []
let dashboardBookingsRenderToken = 0
let dashboardRescheduleTarget = null
let dashboardRescheduleAvailabilityUnsubscribe = null
let gallerySlideshowTimers = []
let gallerySortBy = "recommended"
const galleryFiltersState = {
	service: "all",
	subService: "all",
	length: "all",
	size: "all",
	styleType: "all",
	technique: "all",
}

const GALLERY_SERVICE_FILTER_DEFINITIONS = [
	{ key: "all", label: "All" },
	...clientServiceCategoryDefinitions.map((item) => ({
		key: item.key,
		label: item.galleryLabel || item.shortLabel || item.label,
	})),
]

const GALLERY_SERVICE_DISPLAY_LABELS = Object.fromEntries(
	GALLERY_SERVICE_FILTER_DEFINITIONS.map((item) => [item.key, item.label]),
)

function getGalleryFeaturedCategoryLabel(categoryKey = "all") {
	const normalized = String(categoryKey || "all")
		.trim()
		.toLowerCase()
	if (normalized === "all") return "Styles"
	return getGalleryServiceLabel(normalized)
}

const GALLERY_SERVICE_KEYWORDS = {
	"hair-services": [
		"hair styling",
		"hair cutting",
		"hair coloring",
		"hair relaxing",
		"hair treatment",
		"wig",
		"weaving",
		"extension",
		"blow dry",
		"blow-dry",
		"hair washing",
		"silk press",
		"retouch",
	],
	"braids-services": ["braid", "twist", "cornrow", "knotless", "fulani", "loc"],
	"beauty-spa-services": [
		"facial",
		"body",
		"spa",
		"steam",
		"skin",
		"sauna",
		"acne",
	],
	"nail-services": ["nail", "manicure", "pedicure", "acrylic", "gel"],
	"makeup-services": ["makeup", "bridal makeup", "glam", "foundation"],
	"barber-services": ["barber", "fade", "beard", "cut", "shave"],
	"eyebrow-lash-services": ["eyebrow", "brow", "lash", "eyelash"],
	"bridal-event-packages": ["bridal", "event", "wedding", "package"],
}

function inferGalleryServiceCategory(item = {}) {
	const existingCategory = String(item.serviceCategory || item.category || "")
		.trim()
		.toLowerCase()

	const bag = [
		item.styleName,
		item.styleType,
		item.serviceName,
		item.hairServiceType,
		item.hairTechnique,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase()
	const hairKeywords = GALLERY_SERVICE_KEYWORDS["hair-services"] || []
	const braidsKeywords = GALLERY_SERVICE_KEYWORDS["braids-services"] || []
	const hasHairKeyword = hairKeywords.some((keyword) => bag.includes(keyword))
	const hasBraidsKeyword = braidsKeywords.some((keyword) =>
		bag.includes(keyword),
	)

	if (existingCategory && existingCategory !== "all") {
		if (existingCategory === "hair") {
			return "hair-services"
		}
		if (existingCategory === "braids") {
			return "braids-services"
		}
		if (
			GALLERY_SERVICE_FILTER_DEFINITIONS.some(
				(definition) => definition.key === existingCategory,
			)
		) {
			return existingCategory
		}
		return existingCategory
	}

	if (hasHairKeyword && !hasBraidsKeyword) {
		return "hair-services"
	}

	for (const [categoryKey, keywords] of Object.entries(
		GALLERY_SERVICE_KEYWORDS,
	)) {
		if (keywords.some((keyword) => bag.includes(keyword))) {
			return categoryKey
		}
	}

	return "braids-services"
}

function getGalleryServiceLabel(categoryKey = "") {
	const normalized = String(categoryKey || "all")
		.trim()
		.toLowerCase()
	return (
		GALLERY_SERVICE_DISPLAY_LABELS[normalized] ||
		GALLERY_SERVICE_DISPLAY_LABELS.all
	)
}

function getGalleryViewNounForService(categoryKey = "all") {
	const normalized = String(categoryKey || "all")
		.trim()
		.toLowerCase()
	if (normalized === "all") return "Gallery"
	return getGalleryServiceLabel(normalized)
}

function updateGalleryToggleButtonLabel() {
	const button = document.getElementById("viewAllGallery")
	if (!button) return
	const noun = getGalleryViewNounForService(galleryFiltersState.service)
	button.textContent = showAllGallery ? `View Less ${noun}` : `View All ${noun}`
}

function resetGallerySubFilters() {
	galleryFiltersState.subService = "all"
	galleryFiltersState.length = "all"
	galleryFiltersState.size = "all"
	galleryFiltersState.styleType = "all"
	galleryFiltersState.technique = "all"
}

const preloadedBeforeImageUrls = new Set()
const scheduledBeforeImagePreloadUrls = new Set()

function getBrowserConnectionInfo() {
	return (
		navigator.connection ||
		navigator.mozConnection ||
		navigator.webkitConnection ||
		null
	)
}

function shouldReduceNonCriticalMedia() {
	const connection = getBrowserConnectionInfo()
	const effectiveType = String(connection?.effectiveType || "").toLowerCase()
	return Boolean(connection?.saveData) || /(^|-)2g$/.test(effectiveType)
}

function runWhenBrowserIdle(callback, timeout = 2000) {
	if (typeof callback !== "function") return
	if (typeof window.requestIdleCallback === "function") {
		window.requestIdleCallback(callback, { timeout })
		return
	}
	window.setTimeout(callback, Math.min(Math.max(timeout, 1), 2000))
}

function preloadGalleryBeforeImages(items = []) {
	if (shouldReduceNonCriticalMedia()) return

	items.forEach((item) => {
		const beforeUrl = String(item?.beforeImageUrl || "").trim()
		if (!item?.hasBeforeAfter || !beforeUrl) return
		if (preloadedBeforeImageUrls.has(beforeUrl)) return
		if (scheduledBeforeImagePreloadUrls.has(beforeUrl)) return

		scheduledBeforeImagePreloadUrls.add(beforeUrl)
		runWhenBrowserIdle(() => {
			if (preloadedBeforeImageUrls.has(beforeUrl)) {
				scheduledBeforeImagePreloadUrls.delete(beforeUrl)
				return
			}

			const img = new Image()
			img.decoding = "async"
			img.loading = "lazy"
			img.onload = () => {
				preloadedBeforeImageUrls.add(beforeUrl)
				scheduledBeforeImagePreloadUrls.delete(beforeUrl)
			}
			img.onerror = () => {
				preloadedBeforeImageUrls.delete(beforeUrl)
				scheduledBeforeImagePreloadUrls.delete(beforeUrl)
			}
			img.src = beforeUrl
		}, 2500)
	})
}

const fallbackBlogsData = [
	{
		title: "How to Keep Knotless Braids Fresh for Weeks",
		excerpt:
			"Discover simple daily and nightly habits that keep your knotless braids neat, moisturized, and long-lasting.",
		imageUrl: "IMG/knotless braids.jpg",
		publishDate: "2026-04-16",
		readTime: "5 min read",
		readMoreUrl: "#blog",
	},
	{
		title: "Scalp Care Tips for Protective Styles",
		excerpt:
			"Healthy braids start with a healthy scalp. Learn the products and routines our stylists recommend for itch-free comfort.",
		imageUrl: "IMG/natural hair care.webp",
		publishDate: "2026-03-28",
		readTime: "6 min read",
		readMoreUrl: "#blog",
	},
	{
		title: "Top Bridal Braids for Nairobi Brides",
		excerpt:
			"From elegant up-dos to crown-inspired braid patterns, explore timeless bridal options for your big day.",
		imageUrl: "IMG/goddess-braids.webp",
		publishDate: "2026-03-08",
		readTime: "4 min read",
		readMoreUrl: "#blog",
	},
	{
		title: "Before-and-After Transformations We Love",
		excerpt:
			"See how the right braid pattern, parting, and finish can transform your entire look while protecting natural hair.",
		imageUrl: "IMG/box-braids-hairstyles-1x1-1.jpg",
		publishDate: "2026-02-14",
		readTime: "5 min read",
		readMoreUrl: "#blog",
	},
	{
		title: "Braids for Busy Professionals",
		excerpt:
			"Need a low-maintenance style that still looks polished? These braid options are ideal for packed work schedules.",
		imageUrl: "IMG/Lemonade_Braids.webp",
		publishDate: "2026-01-30",
		readTime: "4 min read",
		readMoreUrl: "#blog",
	},
	{
		title: "Kids Braiding: Comfort-First Styling Guide",
		excerpt:
			"Our gentle approach to kids braiding keeps little ones comfortable while delivering neat and durable protective styles.",
		imageUrl: "IMG/Kids-Small Single Braids after.jpg",
		publishDate: "2026-01-12",
		readTime: "5 min read",
		readMoreUrl: "#blog",
	},
]

const BLOG_CARD_IMAGE_FALLBACK = "IMG/Kids-Small Single Braids after.jpg"

let blogsData = [...fallbackBlogsData]
let blogsRealtimeUnsubscribe = null
const DEFAULT_VISIBLE_BLOGS = 3
let showAllBlogs = false
let blogsToggleAnimationTimer = null

const fallbackTestimonialsData = [
	{
		name: "Fatuma Ali",
		avatar: "FA",
		role: "Regular Client",
		text: "Fatima is the best braider in Nairobi! My knotless braids lasted 8 weeks and my edges stayed intact. Highly recommend Royal Cuts!",
		rating: 5,
		source: "Google",
	},
	{
		name: "Amina Hassan",
		avatar: "AH",
		role: "New Client",
		text: "Finally found a salon that understands my hair! The box braids are neat, affordable, and the salon is so welcoming. I'm never going anywhere else!",
		rating: 5,
		source: "Instagram",
	},
	{
		name: "Zainab Mohammed",
		avatar: "ZM",
		role: "5 Years Client",
		text: "I've been coming to Royal Cuts for 5 years. The consistency, professionalism, and quality are unmatched. My go-to for all protective styles!",
		rating: 5,
		source: "Facebook",
	},
	{
		name: "Grace Wanjiku",
		avatar: "GW",
		role: "Bridal Client",
		text: "Had my bridal braids done here and they were stunning! Lasted through my entire honeymoon. Thank you to the amazing team!",
		rating: 5,
		source: "Google",
	},
	{
		name: "Aisha Diallo",
		avatar: "AD",
		role: "Monthly Client",
		text: "Grace is a natural hair expert! She always gives the best advice on maintaining my hair between appointments. Love this place!",
		rating: 5,
		source: "Instagram",
	},
	{
		name: "Sarah Omondi",
		avatar: "SO",
		role: "Mom of 3",
		text: "Sarah is so patient with my daughters! The kids braiding service is excellent and my girls always leave happy. Best salon for families!",
		rating: 5,
		source: "Google",
	},
]

let testimonialsData = [...fallbackTestimonialsData]
let testimonialsRealtimeUnsubscribe = null
const DEFAULT_VISIBLE_REVIEWS = 6
let showAllReviews = false
let reviewsSortMode = "featured"
let reviewMessageTimer = null
let reviewsToggleAnimationTimer = null
const recentlyReportedReviewIds = new Set()
const reviewReportResetTimers = new Map()
let waitlistJoinFeedbackTimer = null
let favoritesToastTimer = null
let dashboardFavoritesMessageTimer = null
let authMessageTimer = null
let accountDeletePopupTimer = null
let pendingDeleteAccountResolver = null
let deleteAccountConfirmCloseTimer = null
const formMessageTimers = new WeakMap()
const formMessageToastPlacements = new WeakMap()
const REVIEW_LOCAL_KEYS = {
	profanityWords: "rb_admin_profanity_words",
	reviewDrafts: "rb_review_drafts",
}

const MANAGE_ACCOUNT_LOCAL_KEYS = {
	notifications: "rb_manage_notifications",
	accessibility: "rb_manage_accessibility",
}

const DEFAULT_PROFANITY_WORDS = [
	"fuck",
	"shit",
	"bitch",
	"asshole",
	"stupid",
	"idiot",
	"scam",
]

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
}

function toTimestampMs(value) {
	if (!value) return 0
	if (typeof value?.toMillis === "function") return value.toMillis()
	if (typeof value === "number" && Number.isFinite(value)) return value
	if (value?.seconds && Number.isFinite(value.seconds))
		return value.seconds * 1000
	const parsed = Date.parse(String(value))
	return Number.isNaN(parsed) ? 0 : parsed
}

function formatDateTime(value) {
	const ms = toTimestampMs(value)
	if (!ms) return "N/A"
	return new Date(ms).toLocaleString()
}

function getStoredProfanityWords() {
	try {
		const raw = localStorage.getItem(REVIEW_LOCAL_KEYS.profanityWords)
		if (!raw) return [...DEFAULT_PROFANITY_WORDS]
		const parsed = JSON.parse(raw)
		if (!Array.isArray(parsed)) return [...DEFAULT_PROFANITY_WORDS]
		const cleaned = parsed
			.map((w) =>
				String(w || "")
					.trim()
					.toLowerCase(),
			)
			.filter(Boolean)
		return cleaned.length ? cleaned : [...DEFAULT_PROFANITY_WORDS]
	} catch (_error) {
		return [...DEFAULT_PROFANITY_WORDS]
	}
}

function textContainsBlockedWord(text = "") {
	const normalized = String(text || "").toLowerCase()
	if (!normalized) return false
	const words = getStoredProfanityWords()
	return words.some((word) => {
		if (!word) return false
		return normalized.includes(word)
	})
}

function saveReviewDraft(review = {}) {
	if (!review?.id) return
	try {
		const raw = localStorage.getItem(REVIEW_LOCAL_KEYS.reviewDrafts)
		const data = raw ? JSON.parse(raw) : {}
		data[review.id] = {
			id: review.id,
			name: review.name || "",
			rating: Number(review.rating || 5),
			service: review.service || "",
			text: review.text || "",
			photoUrl: review.photoUrl || "",
			createdAt: review.createdAt || null,
		}
		localStorage.setItem(REVIEW_LOCAL_KEYS.reviewDrafts, JSON.stringify(data))
	} catch (_error) {
		// no-op
	}
}

function removeReviewDraft(reviewId = "") {
	if (!reviewId) return
	try {
		const raw = localStorage.getItem(REVIEW_LOCAL_KEYS.reviewDrafts)
		if (!raw) return
		const data = JSON.parse(raw)
		if (!data || typeof data !== "object") return
		delete data[reviewId]
		localStorage.setItem(REVIEW_LOCAL_KEYS.reviewDrafts, JSON.stringify(data))
	} catch (_error) {
		// no-op
	}
}

function getReviewDraftsArray() {
	try {
		const raw = localStorage.getItem(REVIEW_LOCAL_KEYS.reviewDrafts)
		if (!raw) return []
		const data = JSON.parse(raw)
		if (!data || typeof data !== "object") return []
		return Object.values(data)
	} catch (_error) {
		return []
	}
}

function showFormMessage(msg, type, text) {
	if (!msg) return
	const normalizedType = String(type || "").trim()
	const shouldUseToast =
		normalizedType === "success" || normalizedType === "error"
	if (shouldUseToast) {
		mountFormMessageToast(msg)
	} else {
		restoreFormMessageToast(msg)
	}
	msg.className = shouldUseToast
		? `form-message ${normalizedType} form-message--toast`
		: `form-message ${normalizedType}`
	msg.textContent = text
	msg.style.display = "block"
	msg.classList.remove("is-leaving")
	msg.setAttribute("role", normalizedType === "error" ? "alert" : "status")
	msg.setAttribute(
		"aria-live",
		normalizedType === "error" ? "assertive" : "polite",
	)
	requestAnimationFrame(() => {
		msg.classList.add("is-visible")
	})
}

function mountFormMessageToast(msg) {
	if (!msg || !document.body) return

	if (formMessageToastPlacements.has(msg)) {
		if (msg.parentNode !== document.body) {
			document.body.appendChild(msg)
		}
		return
	}

	const parent = msg.parentNode
	const placeholder = document.createComment("form-message-toast-placeholder")
	if (parent) {
		parent.insertBefore(placeholder, msg)
	}

	formMessageToastPlacements.set(msg, { parent, placeholder })
	document.body.appendChild(msg)
}

function restoreFormMessageToast(msg) {
	if (!msg) return
	const placement = formMessageToastPlacements.get(msg)
	if (!placement) return

	const { parent, placeholder } = placement
	if (parent && placeholder?.parentNode === parent) {
		parent.insertBefore(msg, placeholder)
	} else if (parent) {
		parent.appendChild(msg)
	} else if (msg.parentNode === document.body) {
		msg.remove()
	}

	if (placeholder?.parentNode) {
		placeholder.parentNode.removeChild(placeholder)
	}
	formMessageToastPlacements.delete(msg)
}

function clearFormMessage(msg) {
	if (!msg) return
	const activeTimer = formMessageTimers.get(msg)
	if (activeTimer) {
		clearTimeout(activeTimer)
		formMessageTimers.delete(msg)
	}
	restoreFormMessageToast(msg)
	msg.className = "form-message"
	msg.textContent = ""
	msg.style.display = "none"
	msg.removeAttribute("role")
	msg.removeAttribute("aria-live")
}

function hideReviewMessage(msg, animated = false) {
	if (!msg) return

	if (!animated) {
		clearFormMessage(msg)
		return
	}

	msg.classList.remove("is-visible")
	msg.classList.add("is-leaving")
	setTimeout(() => {
		clearFormMessage(msg)
	}, 300)
}

function showTimedReviewMessage(type, text, duration = 3500) {
	const msg = document.getElementById("reviewMessage")
	if (!msg) return

	if (reviewMessageTimer) {
		clearTimeout(reviewMessageTimer)
		reviewMessageTimer = null
	}

	showFormMessage(msg, type, text)
	reviewMessageTimer = setTimeout(() => {
		hideReviewMessage(msg, true)
		reviewMessageTimer = null
	}, duration)
}

function showTimedFormMessage(msg, type, text, duration = 4000) {
	if (!msg) return

	const activeTimer = formMessageTimers.get(msg)
	if (activeTimer) {
		clearTimeout(activeTimer)
		formMessageTimers.delete(msg)
	}

	showFormMessage(msg, type, text)
	const timerId = setTimeout(() => {
		hideReviewMessage(msg, true)
		formMessageTimers.delete(msg)
	}, duration)
	formMessageTimers.set(msg, timerId)
}

const iconPaths = {
	scissors:
		'<path d="M14.5 9.5L19.5 4.5M9.5 9.5L4.5 4.5M7 17l-3 3m13-3l3 3m-7-3a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>',
	droplet:
		'<path d="M12 22c5.523 0 10-4.477 10-10S12 2 12 2 2 11.477 2 12c0 5.523 4.477 10 10 10z"/><path d="M12 8v4M10 14h4"/>',
	feather:
		'<path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5zM16 8L2 22M17.5 15H9"/>',
	heart:
		'<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
	gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>',
	crown:
		'<path d="M2 20h20"/><path d="M4 20l2-8 4 4 4-8 4 8 2-8 2 8H4z"/><path d="M12 4v8"/>',
	smile:
		'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
}

const timeSlots = [
	"8:00 AM",
	"8:30 AM",
	"9:00 AM",
	"9:30 AM",
	"10:00 AM",
	"10:30 AM",
	"11:00 AM",
	"11:30 AM",
	"12:00 PM",
	"12:30 PM",
	"1:00 PM",
	"1:30 PM",
	"2:00 PM",
	"2:30 PM",
	"3:00 PM",
	"3:30 PM",
	"4:00 PM",
	"4:30 PM",
	"5:00 PM",
	"5:30 PM",
	"6:00 PM",
	"6:30 PM",
	"7:00 PM",
]

const BOOKING_SLOT_UTC_OFFSET_HOURS = 3
const EXPIRED_SLOT_CLEANUP_THROTTLE_MS = 5 * 60 * 1000
const EXPIRED_BOOKING_RELEASE_GRACE_MS = 2 * 60 * 60 * 1000

function parseTimeSlotToMinutes(timeText = "") {
	const match = String(timeText || "")
		.trim()
		.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
	if (!match) return null

	let hours = Number(match[1])
	const minutes = Number(match[2])
	const period = String(match[3] || "").toUpperCase()
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
	if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null

	if (period === "PM" && hours !== 12) hours += 12
	if (period === "AM" && hours === 12) hours = 0

	return hours * 60 + minutes
}

function getBookingSlotStartMs(dateValue = "", timeValue = "") {
	const rawDate = String(dateValue || "").trim()
	const minutesFromMidnight = parseTimeSlotToMinutes(timeValue)
	if (!rawDate || minutesFromMidnight === null) return 0

	const dateParts = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (!dateParts) return 0

	const year = Number(dateParts[1])
	const month = Number(dateParts[2])
	const day = Number(dateParts[3])
	if (!year || !month || !day) return 0

	const hours = Math.floor(minutesFromMidnight / 60)
	const minutes = minutesFromMidnight % 60
	const utcMs = Date.UTC(
		year,
		month - 1,
		day,
		hours - BOOKING_SLOT_UTC_OFFSET_HOURS,
		minutes,
		0,
		0,
	)

	return Number.isFinite(utcMs) ? utcMs : 0
}

function isBookingSlotExpired(slotData = {}, referenceMs = Date.now()) {
	const dateValue = String(
		slotData.date || slotData.bookingDate || slotData.preferredDate || "",
	).trim()
	const timeValue = String(
		slotData.time || slotData.bookingTime || slotData.preferredTime || "",
	).trim()
	const slotStartMs = getBookingSlotStartMs(dateValue, timeValue)
	return Boolean(
		slotStartMs &&
		slotStartMs + EXPIRED_BOOKING_RELEASE_GRACE_MS <= referenceMs,
	)
}

const CUSTOM_SERVICE_OPTION_VALUE = "__custom_service__"
const SERVICE_SETTINGS_DOC_PATH = ["siteSettings", "serviceCategories"]
const SERVICE_CATEGORY_DEFINITIONS = clientServiceCategoryDefinitions.map(
	(item) => ({
		key: item.key,
		label: item.label,
		shortLabel: item.shortLabel,
		galleryLabel: item.galleryLabel,
	}),
)
const SERVICE_CATEGORY_LABEL_MAP = Object.fromEntries(
	SERVICE_CATEGORY_DEFINITIONS.map((item) => [item.key, item.label]),
)
const MAIN_HAIR_SERVICE_NAME_KEYWORDS = [
	"hair styling",
	"hair cutting",
	"hair coloring",
	"hair relaxing",
	"hair treatment",
	"wig",
	"weaving",
	"extension",
	"blow dry",
	"blow-dry",
	"hair washing",
	"silk press",
	"retouch",
]

// ============ APP SERVICES + CLOUDINARY CONFIG ============
const appConfig = window.APP_CONFIG || {}
const clientCloudinaryFolder =
	String(appConfig.cloudinaryFolder || "royal-braids/gallery").trim() ||
	"royal-braids/gallery"

let appServicesReady = false
let db = null
let auth = null
let callableService = null
let activeAvailabilityUnsubscribe = null
let currentBookedSlotEntries = []
let currentBookingTimeSlotOptions = []
let currentBookingTimeSlotMeta = new Map()
let bookingTimePickerControlsBound = false
let pendingWaitlistBooking = null
const expiredSlotCleanupRequestTimes = new Map()
let serviceCategorySettingsUnsubscribe = null
let authMode = "signin"
let authObserverAttached = false
let shouldAutoFocusDashboardAfterAuth = false
let googleAuthInProgress = false
let sessionHeartbeatTimer = null
let currentSessionId = ""
let sessionPresenceBound = false
let activeServicesFilter = "all"
let enabledServiceCategories = Object.fromEntries(
	SERVICE_CATEGORY_DEFINITIONS.map((item) => [item.key, true]),
)

const SESSION_HEARTBEAT_INTERVAL_MS = 60 * 1000
const SESSION_STALE_AFTER_MS = 2 * 60 * 1000

function isNonGuestSignedIn() {
	return Boolean(auth?.currentUser && !auth.currentUser.isAnonymous)
}

const authUi = {
	modal: null,
	openBtn: null,
	closeBtn: null,
	backdrop: null,
	googleBtn: null,
	phoneBtn: null,
	emailForm: null,
	nameGroup: null,
	nameInput: null,
	emailInput: null,
	passwordInput: null,
	passwordToggleBtn: null,
	submitBtn: null,
	switchToSignupBtn: null,
	switchToSigninBtn: null,
	forgotPasswordBtn: null,
	continueAsGuestBtn: null,
	message: null,
	profileMenu: null,
	profileTrigger: null,
	profileDropdown: null,
	profileInitial: null,
	profileName: null,
	logoutBtn: null,
	navDashboardLink: null,
	clientDashboard: null,
	dashboardAuthBtn: null,
	dashboardDeleteAccountBtn: null,
	dashboardMessage: null,
	dashboardBookingsList: null,
	dashboardReviewsList: null,
	dashboardFavoritesList: null,
	dashboardFavoritesCount: null,
	dashboardLoginHistoryList: null,
	dashboardLoginHistoryCount: null,
	dashboardProfileName: null,
	dashboardProfileEmail: null,
	dashboardProfilePhone: null,
	dashboardRescheduleModal: null,
	dashboardRescheduleBackdrop: null,
	dashboardRescheduleCloseBtn: null,
	dashboardRescheduleCancelBtn: null,
	dashboardRescheduleSaveBtn: null,
	dashboardRescheduleMessage: null,
	dashboardRescheduleDate: null,
	dashboardRescheduleStylist: null,
	dashboardRescheduleTime: null,
	postBookingAuthPrompt: null,
	postBookingGoogleBtn: null,
	postBookingLaterBtn: null,
	reviewAuthHint: null,
	reviewAuthHintBtn: null,
	reviewSubmitWrap: null,
	reviewSubmitAuthGate: null,
	reviewSubmitAuthGateBtn: null,
	favoritesToast: null,
	accountDeleteSuccessPopup: null,
	deleteAccountConfirmModal: null,
	deleteAccountConfirmBackdrop: null,
	deleteAccountConfirmCloseBtn: null,
	deleteAccountConfirmCancelBtn: null,
	deleteAccountConfirmProceedBtn: null,
	deleteAccountConfirmMessage: null,
	manageAccountModal: null,
	manageAccountBackdrop: null,
	manageAccountCloseBtn: null,
	manageAccountMessage: null,
	manageAccountName: null,
	manageAccountEmail: null,
	manageAccountEmailHint: null,
	manageAccountPhone: null,
	manageAccountPhoneHint: null,
	manageAccountAvatarInput: null,
	manageAccountAvatarPreview: null,
	manageAccountAvatarInitial: null,
	manageAccountSaveProfileBtn: null,
	manageAccountCurrentPassword: null,
	manageAccountCurrentPasswordToggle: null,
	manageAccountNewPassword: null,
	manageAccountNewPasswordToggle: null,
	managePasswordStrengthFill: null,
	managePasswordStrengthText: null,
	managePasswordChecks: null,
	manageAccountChangePasswordBtn: null,
	manageAccountResetPasswordBtn: null,
	manageAccountThemeSelect: null,
	manageAccountFontSizeSelect: null,
	manageAccountHighContrast: null,
	manageAccountReducedMotion: null,
	manageAccountNotifEmail: null,
	manageAccountNotifSms: null,
	manageAccountNotifPush: null,
	manageAccountSavePreferencesBtn: null,
	manageAccountDeleteBtn: null,
}

function getFriendlyAuthError(error) {
	const code = error?.code || ""

	if (code === "auth/popup-closed-by-user") {
		return "Sign-in popup was closed before completing. Please try again."
	}

	if (code === "auth/popup-blocked") {
		return "Popup was blocked by your browser. Allow popups for this site and try again."
	}

	if (code === "auth/cancelled-popup-request") {
		return "A sign-in attempt is already in progress. Please wait and try again."
	}

	if (code === "auth/unauthorized-domain") {
		return "This website domain is not authorized for browser authentication. Check the Supabase redirect URL settings."
	}

	if (code === "auth/invalid-credential") {
		return "Invalid sign-in credential. Please try again with Google."
	}

	if (code === "auth/invalid-action-code") {
		return "The requested auth action is invalid or expired. Please retry sign-in."
	}

	if (code === "auth/operation-not-supported-in-this-environment") {
		return "Google popup sign-in is not supported in this environment. Use a normal browser window (not restricted/private embedded mode)."
	}

	if (code === "auth/user-disabled") {
		return "This account has been disabled. Please contact support."
	}

	if (error?.code === "auth/admin-restricted-operation") {
		return "Guest sign-in is unavailable. Check the browser auth configuration."
	}

	if (error?.code === "auth/operation-not-allowed") {
		return "This sign-in method is not enabled in the browser auth configuration."
	}

	if (code === "auth/requires-recent-login") {
		return "For your security, please log in again before deleting your account."
	}

	return error?.message || "Authentication failed"
}

function isSupabaseInvalidCredentialsError(error = {}) {
	const code = String(
		error?.code || error?.error || error?.error_code || error?.status || "",
	)
		.trim()
		.toLowerCase()
	const message = String(
		error?.message || error?.msg || error?.error_description || "",
	)
		.trim()
		.toLowerCase()

	return (
		[
			"invalid_credentials",
			"invalid_grant",
			"auth/invalid-login-credentials",
		].includes(code) ||
		/invalid\s+(login\s+)?credentials?/.test(message) ||
		/invalid\s+email\s+or\s+password/.test(message)
	)
}

function setGoogleAuthButtonsBusy(isBusy) {
	const busy = isBusy === true
	if (authUi.googleBtn) {
		setButtonLoadingState(authUi.googleBtn, busy, {
			loadingText: "Signing in...",
			resetText: "Continue with Google",
		})
	}
	if (authUi.postBookingGoogleBtn) {
		setButtonLoadingState(authUi.postBookingGoogleBtn, busy, {
			loadingText: "Signing in...",
			resetText: "Log In Now",
		})
	}
}

function setButtonLoadingState(button, isLoading, options = {}) {
	if (!button) return

	const {
		loadingText = "Loading...",
		resetText = null,
		skipTextForCheckbox = true,
	} = options

	const isCheckbox = button.type === "checkbox"

	if (isLoading === true) {
		if (button.dataset.originalLabel === undefined) {
			button.dataset.originalLabel = button.textContent || ""
		}

		button.disabled = true
		button.classList.add("btn-loading")
		button.setAttribute("aria-busy", "true")

		if (
			!(skipTextForCheckbox && isCheckbox) &&
			typeof loadingText === "string"
		) {
			button.textContent = loadingText
		}
		return
	}

	button.disabled = false
	button.classList.remove("btn-loading")
	button.removeAttribute("aria-busy")

	if (!(skipTextForCheckbox && isCheckbox)) {
		const fallbackText = button.dataset.originalLabel || ""
		const nextText = typeof resetText === "string" ? resetText : fallbackText
		if (nextText) {
			button.textContent = nextText
		}
	}

	if (typeof resetText === "string") {
		button.dataset.originalLabel = resetText
	} else if (button.dataset.originalLabel !== undefined) {
		button.dataset.originalLabel = button.textContent || ""
	}
}

function setAuthSwitchingState(isSwitching) {
	const active = isSwitching === true
	authUi.openBtn?.classList.toggle("is-auth-switching", active)
	authUi.profileTrigger?.classList.toggle("is-auth-switching", active)
}

function shouldPreferRedirectGoogleAuth() {
	const ua = navigator.userAgent || ""
	const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
	const isEmbeddedBrowser =
		/(FBAN|FBAV|Instagram|Line|LinkedInApp|Twitter|wv|WebView)/i.test(ua) ||
		/ /.test(ua)

	return isMobileDevice || isEmbeddedBrowser
}

function normalizeLoginMethod(method = "") {
	const raw = String(method || "")
		.trim()
		.toLowerCase()
	if (raw === "google" || raw === "google.com") return "google"
	if (raw === "password" || raw === "email" || raw === "email/password") {
		return "email/password"
	}
	if (raw === "anonymous" || raw === "guest") return "anonymous"
	return "unknown"
}

function normalizeLoginStatus(status = "") {
	const raw = String(status || "")
		.trim()
		.toLowerCase()
	return raw === "failure" ? "failure" : "success"
}

function getLoginDeviceTypeFromUserAgent(ua = "") {
	const userAgent = String(ua || "")
	if (/iPad|Tablet|Kindle|PlayBook|Silk/i.test(userAgent)) return "tablet"
	if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(userAgent)) return "mobile"
	return "desktop"
}

function getLoginBrowserFromUserAgent(ua = "") {
	const userAgent = String(ua || "")
	if (/Edg\//i.test(userAgent)) return "Edge"
	if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) return "Opera"
	if (/Firefox\//i.test(userAgent)) return "Firefox"
	if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
		return "Chrome"
	}
	if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
		return "Safari"
	}
	return "Unknown"
}

function buildLoginClientContext() {
	const ua = navigator.userAgent || ""
	return {
		deviceType: getLoginDeviceTypeFromUserAgent(ua),
		browser: getLoginBrowserFromUserAgent(ua),
		locale: navigator.language || "",
		timezone:
			typeof Intl !== "undefined"
				? Intl.DateTimeFormat().resolvedOptions().timeZone || ""
				: "",
	}
}

function generateSessionId() {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID()
	}
	return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function getSessionPresenceRef(uid = "", sessionId = "") {
	const safeUid = String(uid || "").trim()
	const safeSessionId = String(sessionId || "").trim()
	if (!appServicesReady || !db || !safeUid || !safeSessionId) return null
	return db
		.collection("userSessions")
		.doc(safeUid)
		.collection("sessions")
		.doc(safeSessionId)
}

async function writeSessionPresence({
	online = true,
	markSessionStart = false,
} = {}) {
	if (
		!appServicesReady ||
		!db ||
		!auth?.currentUser ||
		auth.currentUser.isAnonymous
	)
		return

	const uid = String(auth.currentUser.uid || "").trim()
	if (!uid) return

	if (!currentSessionId) {
		currentSessionId = generateSessionId()
	}

	const ref = getSessionPresenceRef(uid, currentSessionId)
	if (!ref) return

	const nowMs = Date.now()
	const client = buildLoginClientContext()
	const payload = {
		uid,
		sessionId: currentSessionId,
		online: online === true,
		lastActiveAt: getServerTimestamp(),
		lastActiveAtMs: nowMs,
		deviceType: client.deviceType,
		browser: client.browser,
		methodHint: normalizeLoginMethod(
			auth.currentUser.providerData?.[0]?.providerId ||
				(auth.currentUser.isAnonymous ? "anonymous" : "email/password"),
		),
		timezone: client.timezone,
		locale: client.locale,
		updatedAt: getServerTimestamp(),
	}

	if (online === true && markSessionStart === true) {
		payload.startedAt = getServerTimestamp()
		payload.startedAtMs = nowMs
	}

	try {
		await ref.set(payload, { merge: true })
	} catch (error) {
		console.warn("Session presence update failed:", error)
	}
}

function stopSessionHeartbeat() {
	if (sessionHeartbeatTimer) {
		clearInterval(sessionHeartbeatTimer)
		sessionHeartbeatTimer = null
	}
}

function startSessionHeartbeat() {
	stopSessionHeartbeat()
	if (
		!appServicesReady ||
		!db ||
		!auth?.currentUser ||
		auth.currentUser.isAnonymous
	)
		return

	void writeSessionPresence({ online: true, markSessionStart: true })
	sessionHeartbeatTimer = setInterval(() => {
		void writeSessionPresence({ online: true, markSessionStart: false })
	}, SESSION_HEARTBEAT_INTERVAL_MS)
}

async function markCurrentSessionOffline() {
	if (!appServicesReady || !db || !auth?.currentUser || !currentSessionId)
		return
	const uid = String(auth.currentUser.uid || "").trim()
	if (!uid) return

	const ref = getSessionPresenceRef(uid, currentSessionId)
	if (!ref) return

	try {
		await ref.set(
			{
				online: false,
				lastActiveAt: getServerTimestamp(),
				lastActiveAtMs: Date.now(),
				updatedAt: getServerTimestamp(),
			},
			{ merge: true },
		)
	} catch (error) {
		console.warn("Session offline update failed:", error)
	}
}

function bindSessionPresenceLifecycle() {
	if (sessionPresenceBound) return
	sessionPresenceBound = true

	window.addEventListener("beforeunload", () => {
		void markCurrentSessionOffline()
	})

	document.addEventListener("visibilitychange", () => {
		if (document.hidden) {
			void markCurrentSessionOffline()
			stopSessionHeartbeat()
		} else if (auth?.currentUser && !auth.currentUser.isAnonymous) {
			startSessionHeartbeat()
		}
	})
}

function normalizeSecurityRestrictionState(raw = {}) {
	const data = typeof raw === "object" && raw && !Array.isArray(raw) ? raw : {}
	return {
		blockedUntilMs: Math.max(0, Number(data.blockedUntilMs || 0)),
		forceLogoutAtMs: Math.max(0, Number(data.forceLogoutAtMs || 0)),
		passwordResetRequired: data.passwordResetRequired === true,
	}
}

async function getUserSecurityRestrictionStateByUid(uid = "") {
	const safeUid = String(uid || "").trim()
	if (!appServicesReady || !db || !safeUid) {
		return normalizeSecurityRestrictionState({})
	}

	try {
		const snap = await db.collection("users").doc(safeUid).get()
		if (!snap.exists) return normalizeSecurityRestrictionState({})
		const source = snap.data()?.securityRestrictions || {}
		return normalizeSecurityRestrictionState(source)
	} catch (error) {
		console.warn("Failed to fetch user restrictions by uid:", error)
		return normalizeSecurityRestrictionState({})
	}
}

async function getUserSecurityRestrictionStateByEmail(email = "") {
	const safeEmail = String(email || "")
		.trim()
		.toLowerCase()
	if (!appServicesReady || !db || !safeEmail) {
		return normalizeSecurityRestrictionState({})
	}

	try {
		const snap = await db
			.collection("users")
			.where("email", "==", safeEmail)
			.limit(1)
			.get()
		if (snap.empty) return normalizeSecurityRestrictionState({})
		const source = snap.docs[0]?.data()?.securityRestrictions || {}
		return normalizeSecurityRestrictionState(source)
	} catch (error) {
		console.warn("Failed to fetch user restrictions by email:", error)
		return normalizeSecurityRestrictionState({})
	}
}

function formatRestrictionUntilLabel(untilMs = 0) {
	const ts = Number(untilMs || 0)
	if (!ts) return ""
	const date = new Date(ts)
	if (Number.isNaN(date.getTime())) return ""
	return date.toLocaleString()
}

async function forceRestrictedUserSignOut(message = "") {
	await markCurrentSessionOffline()
	stopSessionHeartbeat()
	currentSessionId = ""

	try {
		if (auth?.currentUser) {
			await auth.signOut()
		}
	} catch (error) {
		console.warn("Restricted signout failed:", error)
	}

	if (message && authUi.message) {
		showTimedAuthMessage("error", message)
	}
}

async function enforceSignedInUserSecurityRestrictions(user, context = {}) {
	if (!user || user.isAnonymous) return true

	const nowMs = Date.now()
	let claimBlockedUntilMs = 0
	let claimForceLogoutAtMs = 0
	let claimPasswordResetRequired = false

	try {
		const tokenResult = await user.getIdTokenResult(true)
		const claims = tokenResult?.claims || {}
		claimBlockedUntilMs = Math.max(0, Number(claims.accountBlockedUntilMs || 0))
		claimForceLogoutAtMs = Math.max(0, Number(claims.forceLogoutAfterMs || 0))
		claimPasswordResetRequired = claims.passwordResetRequired === true
	} catch (error) {
		console.warn("Token claim restriction check failed:", error)
	}

	const docRestrictions = await getUserSecurityRestrictionStateByUid(user.uid)
	const blockedUntilMs = Math.max(
		claimBlockedUntilMs,
		docRestrictions.blockedUntilMs,
	)
	const forceLogoutAtMs = Math.max(
		claimForceLogoutAtMs,
		docRestrictions.forceLogoutAtMs,
	)
	const passwordResetRequired =
		claimPasswordResetRequired || docRestrictions.passwordResetRequired

	if (blockedUntilMs > nowMs) {
		const untilLabel = formatRestrictionUntilLabel(blockedUntilMs)
		await forceRestrictedUserSignOut(
			`⛔ This account is temporarily blocked${untilLabel ? ` until ${untilLabel}` : ""}. Contact support if you need help.`,
		)
		return false
	}

	if (forceLogoutAtMs > 0) {
		await forceRestrictedUserSignOut(
			"🔒 Your session was ended by an administrator. Please sign in again if needed.",
		)
		return false
	}

	if (passwordResetRequired) {
		if (user.email) {
			try {
				await auth.sendPasswordResetEmail(user.email)
			} catch (error) {
				console.warn("Forced reset email send failed:", error)
			}
		}

		const source = String(context?.source || "").trim()
		await forceRestrictedUserSignOut(
			`🔐 Admin security policy requires a password reset${source ? ` (${source})` : ""}. We've sent reset instructions to your email.`,
		)
		return false
	}

	return true
}

async function checkTemporaryBlockBeforeEmailSignIn(email = "") {
	const restriction = await getUserSecurityRestrictionStateByEmail(email)
	const blockedUntilMs = Math.max(0, Number(restriction.blockedUntilMs || 0))
	if (blockedUntilMs > Date.now()) {
		return {
			blocked: true,
			blockedUntilMs,
		}
	}

	return { blocked: false, blockedUntilMs: 0 }
}

async function trackLoginActivity({
	method = "unknown",
	status = "success",
	error = null,
	context = {},
} = {}) {
	if (
		!appServicesReady ||
		!callableService ||
		typeof callableService.httpsCallable !== "function"
	) {
		return
	}

	const logLoginActivity = callableService.httpsCallable("logLoginActivity")
	const client = buildLoginClientContext()
	const attemptedEmail = String(context?.attemptedEmail || "")
		.trim()
		.toLowerCase()

	try {
		await logLoginActivity({
			method: normalizeLoginMethod(method),
			status: normalizeLoginStatus(status),
			deviceType: client.deviceType,
			browser: client.browser,
			locale: client.locale,
			timezone: client.timezone,
			source: String(context?.source || "").trim(),
			failureCode: String(error?.code || "").trim(),
			attemptedEmail,
		})
	} catch (trackError) {
		console.warn("Login activity tracking failed:", trackError)
	}
}

async function trackAccountSecurityChange({
	changeType = "",
	details = "",
	context = {},
} = {}) {
	if (
		!appServicesReady ||
		!auth?.currentUser ||
		auth.currentUser.isAnonymous ||
		!callableService ||
		typeof callableService.httpsCallable !== "function"
	) {
		return
	}

	const logAccountSecurityChange = callableService.httpsCallable(
		"logAccountSecurityChange",
	)
	const client = buildLoginClientContext()

	try {
		await logAccountSecurityChange({
			changeType: String(changeType || "")
				.trim()
				.toLowerCase(),
			details: String(details || "").trim(),
			source: String(context?.source || "").trim(),
			metadata: {
				deviceType: client.deviceType,
				browser: client.browser,
				locale: client.locale,
				timezone: client.timezone,
			},
		})
	} catch (trackError) {
		console.warn("Account security change tracking failed:", trackError)
	}
}

function getHttpsCallableFunction(functionName = "") {
	if (
		!appServicesReady ||
		!callableService ||
		typeof callableService.httpsCallable !== "function"
	) {
		throw new Error(
			"Booking actions are not ready yet. Please refresh and try again.",
		)
	}

	const safeFunctionName = String(functionName || "").trim()
	if (!safeFunctionName) {
		throw new Error("Booking action is not configured.")
	}

	return callableService.httpsCallable(safeFunctionName)
}

async function callClientCancelBookingAction(bookingId = "") {
	const cancelBooking = getHttpsCallableFunction("clientCancelBooking")
	return cancelBooking({ bookingId: String(bookingId || "").trim() })
}

async function callClientRescheduleBookingAction({
	bookingId = "",
	date = "",
	time = "",
	stylistKey = "any",
} = {}) {
	const rescheduleBooking = getHttpsCallableFunction("clientRescheduleBooking")
	return rescheduleBooking({
		bookingId: String(bookingId || "").trim(),
		date: String(date || "").trim(),
		time: String(time || "").trim(),
		stylistKey: normalizeStylistKey(stylistKey || "any"),
	})
}

async function callClientReleaseExpiredBookingSlotAction(slotId = "") {
	const releaseExpiredBookingSlot = getHttpsCallableFunction(
		"clientReleaseExpiredBookingSlot",
	)
	return releaseExpiredBookingSlot({ slotId: String(slotId || "").trim() })
}

async function callClientGetWaitlistQueueInfoAction({
	bookingId = "",
	waitlistId = "",
} = {}) {
	const getWaitlistQueueInfo = getHttpsCallableFunction(
		"clientGetWaitlistQueueInfo",
	)
	const response = await getWaitlistQueueInfo({
		bookingId: String(bookingId || "").trim(),
		waitlistId: String(waitlistId || "").trim(),
	})
	return response?.data || null
}

async function finalizeGoogleSignInResult(user, context = {}) {
	if (!user || user.isAnonymous) {
		throw new Error("Google sign-in did not complete. Please try again.")
	}

	const allowed = await enforceSignedInUserSecurityRestrictions(user, {
		source: context?.source || "google",
	})
	if (!allowed) return

	setDashboardSignedInState(user)
	closeAuthModal()
	const loggedInName = getUserDisplayName(user)
	showFavoritesToast(`You're now Logged In as ${loggedInName}`)
	focusDashboardAfterAuthIfRequested()

	await Promise.allSettled([
		upsertUserProfile(user, { provider: "google.com" }),
		loadUserDashboardData(user),
	])

	void trackLoginActivity({
		method: "google",
		status: "success",
		context,
	})

	if (context.source === "redirect" && authUi.message) {
		showTimedAuthMessage("success", "✅ Signed in with Google successfully.")
	}
}

async function handleGoogleRedirectResultOnLoad(showNoResult = false) {
	if (!appServicesReady || !auth) return false

	try {
		const redirectResult = await auth.getRedirectResult()
		const redirectedUser = redirectResult?.user || auth.currentUser
		if (redirectedUser && !redirectedUser.isAnonymous) {
			await finalizeGoogleSignInResult(redirectedUser, { source: "redirect" })
			return true
		}

		if (showNoResult && authUi.message) {
			showTimedAuthMessage(
				"error",
				"❌ Google redirect sign-in did not complete. Please try again.",
			)
		}
		return false
	} catch (error) {
		console.error("Google redirect result failed:", error)
		if (authUi.message) {
			showTimedAuthMessage("error", `❌ ${getFriendlyAuthError(error)}`)
		}
		return false
	}
}

function getAppServices() {
	return window.AppServices || {}
}

function getServerTimestamp() {
	const services = getAppServices()
	return typeof services.serverTimestamp === "function"
		? services.serverTimestamp()
		: new Date().toISOString()
}

function getTimestampFromMillis(millis = Date.now()) {
	const safeMillis = Number(millis || Date.now())
	const services = getAppServices()
	return typeof services.timestampFromMillis === "function"
		? services.timestampFromMillis(safeMillis)
		: new Date(safeMillis).toISOString()
}

function getIncrementValue(amount = 1) {
	const services = getAppServices()
	return typeof services.increment === "function"
		? services.increment(amount)
		: { __type: "increment", amount }
}

function getDocumentIdField() {
	const services = getAppServices()
	return typeof services.documentIdField === "function"
		? services.documentIdField()
		: "__name__"
}

function createEmailCredential(email, password) {
	const services = getAppServices()
	return typeof services.emailCredential === "function"
		? services.emailCredential(email, password)
		: { email, password }
}

function createGoogleProvider() {
	const services = getAppServices()
	const provider =
		typeof services.googleProvider === "function"
			? services.googleProvider()
			: { providerId: "google" }
	if (provider && typeof provider.setCustomParameters !== "function") {
		provider.setCustomParameters = function () {}
	}
	return provider
}

function canInitializeAppServices() {
	const services = getAppServices()
	return Boolean(services.auth && services.db)
}

function getDefaultEnabledServiceCategoriesState() {
	return Object.fromEntries(
		SERVICE_CATEGORY_DEFINITIONS.map((item) => [item.key, true]),
	)
}

function normalizeEnabledServiceCategoriesState(raw = {}) {
	const defaults = getDefaultEnabledServiceCategoriesState()
	const source =
		typeof raw === "object" && raw && !Array.isArray(raw) ? raw : defaults

	SERVICE_CATEGORY_DEFINITIONS.forEach((item) => {
		defaults[item.key] = source[item.key] !== false
	})

	return defaults
}

function inferPrimaryServiceCategory(service = {}) {
	const rawCategory = String(service.category || "")
		.trim()
		.toLowerCase()

	if (rawCategory === "braids-services") return "braids-services"
	if (rawCategory === "hair") return "hair-services"

	const bag = [service.name, service.desc]
		.filter(Boolean)
		.join(" ")
		.toLowerCase()
	const isHairService = MAIN_HAIR_SERVICE_NAME_KEYWORDS.some((keyword) =>
		bag.includes(keyword),
	)

	if (rawCategory === "hair-services") {
		return isHairService ? "hair-services" : "braids-services"
	}

	return rawCategory || "braids-services"
}

function normalizeServiceRecord(service = {}) {
	const category = inferPrimaryServiceCategory(service)
	return {
		...service,
		category,
		categoryLabel:
			SERVICE_CATEGORY_LABEL_MAP[category] || service.categoryLabel || "",
	}
}

function getVisibleServicesData() {
	return servicesData
		.map((service) => normalizeServiceRecord(service))
		.filter((service) => enabledServiceCategories[service.category] !== false)
}

function isServiceCategoryEnabled(categoryKey = "") {
	const normalizedKey = String(categoryKey || "").trim()
	if (!normalizedKey || normalizedKey === "all") return true
	return enabledServiceCategories[normalizedKey] !== false
}

function syncServicesTabsVisibility() {
	const tabs = Array.from(document.querySelectorAll(".services-tab"))
	if (!tabs.length) return

	tabs.forEach((tab) => {
		const filterKey = String(tab.dataset.filter || "all").trim()
		const visible =
			filterKey === "all" || enabledServiceCategories[filterKey] !== false
		tab.style.display = visible ? "" : "none"

		if (!visible) {
			tab.classList.remove("active")
		}
	})

	const visibleTabs = tabs.filter((tab) => tab.style.display !== "none")
	const activeVisibleTab = visibleTabs.find((tab) =>
		tab.classList.contains("active"),
	)
	if (!activeVisibleTab && visibleTabs.length) {
		visibleTabs[0].classList.add("active")
		activeServicesFilter = String(visibleTabs[0].dataset.filter || "all")
	}
}

function stopServiceCategorySettingsListener() {
	if (typeof serviceCategorySettingsUnsubscribe === "function") {
		serviceCategorySettingsUnsubscribe()
		serviceCategorySettingsUnsubscribe = null
	}
}

function applyServiceCategorySettings(rawCategories = {}) {
	enabledServiceCategories =
		normalizeEnabledServiceCategoriesState(rawCategories)

	if (
		activeServicesFilter !== "all" &&
		enabledServiceCategories[activeServicesFilter] === false
	) {
		activeServicesFilter = "all"
	}

	if (!isServiceCategoryEnabled(galleryFiltersState.service)) {
		galleryFiltersState.service = "all"
		resetGallerySubFilters()
		showAllGallery = false
	}

	const serviceSelect = document.getElementById("serviceSelect")
	const customServiceInput = document.getElementById("customServiceInput")
	const selectedBookingValue = serviceSelect?.value || ""
	const currentBookingService =
		selectedBookingValue === CUSTOM_SERVICE_OPTION_VALUE
			? customServiceInput?.value?.trim() || ""
			: selectedBookingValue
	const currentReviewService =
		document.getElementById("reviewService")?.value || ""

	syncServicesTabsVisibility()
	renderServices(activeServicesFilter)
	populateReviewServiceSelect()
	populateServiceSelect()
	renderGalleryFilters()
	renderFeaturedStyles()
	renderGallery()
	setBookingServiceValue(currentBookingService)

	const reviewSelect = document.getElementById("reviewService")
	if (reviewSelect) {
		const canRestoreReviewValue = Array.from(reviewSelect.options).some(
			(option) => option.value === currentReviewService,
		)
		reviewSelect.value = canRestoreReviewValue ? currentReviewService : ""
	}
}

function startServiceCategorySettingsListener() {
	if (!appServicesReady || !db) return

	stopServiceCategorySettingsListener()

	serviceCategorySettingsUnsubscribe = db
		.collection(SERVICE_SETTINGS_DOC_PATH[0])
		.doc(SERVICE_SETTINGS_DOC_PATH[1])
		.onSnapshot(
			(snapshot) => {
				const data = snapshot.exists ? snapshot.data() || {} : {}
				applyServiceCategorySettings(data.categories)
			},
			(error) => {
				console.error("Service category settings listener failed:", error)
				applyServiceCategorySettings(getDefaultEnabledServiceCategoriesState())
			},
		)
}

async function initializeAppServices() {
	const services = getAppServices()
	if (!canInitializeAppServices()) {
		console.warn(
			"App services are not configured. Load JS/supabase-browser-adapter.js before JS/script.js.",
		)
		return
	}

	auth = services.auth
	db = services.db
	callableService = services.functionsService || services.functions || null
	attachAuthStateObserver()
	try {
		if (typeof auth.setPersistence === "function") {
			await auth.setPersistence(services.Persistence?.LOCAL || "local")
		}
	} catch (persistenceError) {
		console.warn("Auth persistence setup failed:", persistenceError)
	}

	appServicesReady = true
	startServiceCategorySettingsListener()

	const persistedUser = auth.currentUser
	if (persistedUser && !persistedUser.isAnonymous) {
		setDashboardSignedInState(persistedUser)
		await Promise.allSettled([
			upsertUserProfile(persistedUser),
			loadUserDashboardData(persistedUser),
		])
	}
}

function initAuthUiRefs() {
	authUi.modal = document.getElementById("authModal")
	authUi.openBtn = document.getElementById("openAuthModalBtn")
	authUi.closeBtn = document.getElementById("closeAuthModalBtn")
	authUi.backdrop = document.getElementById("authModalBackdrop")
	authUi.googleBtn = document.getElementById("continueWithGoogleBtn")
	authUi.phoneBtn = document.getElementById("continueWithPhoneBtn")
	authUi.emailForm = document.getElementById("emailAuthForm")
	authUi.nameGroup = document.getElementById("authNameGroup")
	authUi.nameInput = document.getElementById("authName")
	authUi.emailInput = document.getElementById("authEmail")
	authUi.passwordInput = document.getElementById("authPassword")
	authUi.passwordToggleBtn = document.getElementById("authPasswordToggle")
	authUi.submitBtn = document.getElementById("emailAuthSubmit")
	authUi.switchToSignupBtn = document.getElementById("switchToSignupBtn")
	authUi.switchToSigninBtn = document.getElementById("switchToSigninBtn")
	authUi.forgotPasswordBtn = document.getElementById("forgotPasswordBtn")
	authUi.continueAsGuestBtn = document.getElementById("continueAsGuestBtn")
	authUi.message = document.getElementById("authMessage")
	authUi.profileMenu = document.getElementById("authProfileMenu")
	authUi.profileTrigger = document.getElementById("authProfileTrigger")
	authUi.profileDropdown = document.getElementById("authProfileDropdown")
	authUi.profileInitial = document.getElementById("authProfileInitial")
	authUi.profileName = document.getElementById("authProfileName")
	authUi.logoutBtn = document.getElementById("logoutBtn")
	authUi.navDashboardLink = document.getElementById("navDashboardLink")
	authUi.clientDashboard = document.getElementById("clientDashboard")
	authUi.dashboardAuthBtn = document.getElementById("dashboardAuthBtn")
	authUi.dashboardDeleteAccountBtn = document.getElementById(
		"dashboardDeleteAccountBtn",
	)
	authUi.dashboardMessage = document.getElementById("dashboardMessage")
	authUi.dashboardBookingsList = document.getElementById(
		"dashboardBookingsList",
	)
	authUi.dashboardReviewsList = document.getElementById("dashboardReviewsList")
	authUi.dashboardFavoritesList = document.getElementById(
		"dashboardFavoritesList",
	)
	authUi.dashboardFavoritesCount = document.getElementById(
		"dashboardFavoritesCount",
	)
	authUi.dashboardLoginHistoryList = document.getElementById(
		"dashboardLoginHistoryList",
	)
	authUi.dashboardLoginHistoryCount = document.getElementById(
		"dashboardLoginHistoryCount",
	)
	authUi.dashboardProfileName = document.getElementById("dashboardProfileName")
	authUi.dashboardProfileEmail = document.getElementById(
		"dashboardProfileEmail",
	)
	authUi.dashboardProfilePhone = document.getElementById(
		"dashboardProfilePhone",
	)
	authUi.dashboardRescheduleModal = document.getElementById(
		"dashboardRescheduleModal",
	)
	authUi.dashboardRescheduleBackdrop = document.getElementById(
		"dashboardRescheduleBackdrop",
	)
	authUi.dashboardRescheduleCloseBtn = document.getElementById(
		"dashboardRescheduleCloseBtn",
	)
	authUi.dashboardRescheduleCancelBtn = document.getElementById(
		"dashboardRescheduleCancelBtn",
	)
	authUi.dashboardRescheduleSaveBtn = document.getElementById(
		"dashboardRescheduleSaveBtn",
	)
	authUi.dashboardRescheduleMessage = document.getElementById(
		"dashboardRescheduleMessage",
	)
	authUi.dashboardRescheduleDate = document.getElementById(
		"dashboardRescheduleDate",
	)
	authUi.dashboardRescheduleStylist = document.getElementById(
		"dashboardRescheduleStylist",
	)
	authUi.dashboardRescheduleTime = document.getElementById(
		"dashboardRescheduleTime",
	)
	authUi.postBookingAuthPrompt = document.getElementById(
		"postBookingAuthPrompt",
	)
	authUi.postBookingGoogleBtn = document.getElementById("postBookingGoogleBtn")
	authUi.postBookingLaterBtn = document.getElementById("postBookingLaterBtn")
	authUi.reviewAuthHint = document.getElementById("reviewAuthHint")
	authUi.reviewAuthHintBtn = document.getElementById("reviewAuthHintBtn")
	authUi.reviewSubmitWrap = document.getElementById("reviewSubmitWrap")
	authUi.reviewSubmitAuthGate = document.getElementById("reviewSubmitAuthGate")
	authUi.reviewSubmitAuthGateBtn = document.getElementById(
		"reviewSubmitAuthGateBtn",
	)
	authUi.favoritesToast = document.getElementById("favoritesToast")
	authUi.accountDeleteSuccessPopup = document.getElementById(
		"accountDeleteSuccessPopup",
	)
	authUi.deleteAccountConfirmModal = document.getElementById(
		"deleteAccountConfirmModal",
	)
	authUi.deleteAccountConfirmBackdrop = document.getElementById(
		"deleteAccountConfirmBackdrop",
	)
	authUi.deleteAccountConfirmCloseBtn = document.getElementById(
		"deleteAccountConfirmCloseBtn",
	)
	authUi.deleteAccountConfirmCancelBtn = document.getElementById(
		"deleteAccountConfirmCancelBtn",
	)
	authUi.deleteAccountConfirmProceedBtn = document.getElementById(
		"deleteAccountConfirmProceedBtn",
	)
	authUi.deleteAccountConfirmMessage = document.getElementById(
		"deleteAccountConfirmMessage",
	)
	authUi.manageAccountModal = document.getElementById("manageAccountModal")
	authUi.manageAccountBackdrop = document.getElementById(
		"manageAccountBackdrop",
	)
	authUi.manageAccountCloseBtn = document.getElementById(
		"manageAccountCloseBtn",
	)
	authUi.manageAccountMessage = document.getElementById("manageAccountMessage")
	authUi.manageAccountName = document.getElementById("manageAccountName")
	authUi.manageAccountEmail = document.getElementById("manageAccountEmail")
	authUi.manageAccountEmailHint = document.getElementById(
		"manageAccountEmailHint",
	)
	authUi.manageAccountPhone = document.getElementById("manageAccountPhone")
	authUi.manageAccountPhoneHint = document.getElementById(
		"manageAccountPhoneHint",
	)
	authUi.manageAccountAvatarInput = document.getElementById(
		"manageAccountAvatarInput",
	)
	authUi.manageAccountAvatarPreview = document.getElementById(
		"manageAccountAvatarPreview",
	)
	authUi.manageAccountAvatarInitial = document.getElementById(
		"manageAccountAvatarInitial",
	)
	authUi.manageAccountSaveProfileBtn = document.getElementById(
		"manageAccountSaveProfileBtn",
	)
	authUi.manageAccountCurrentPassword = document.getElementById(
		"manageAccountCurrentPassword",
	)
	authUi.manageAccountCurrentPasswordToggle = document.getElementById(
		"manageAccountCurrentPasswordToggle",
	)
	authUi.manageAccountNewPassword = document.getElementById(
		"manageAccountNewPassword",
	)
	authUi.manageAccountNewPasswordToggle = document.getElementById(
		"manageAccountNewPasswordToggle",
	)
	authUi.managePasswordStrengthFill = document.getElementById(
		"managePasswordStrengthFill",
	)
	authUi.managePasswordStrengthText = document.getElementById(
		"managePasswordStrengthText",
	)
	authUi.managePasswordChecks = document.getElementById("managePasswordChecks")
	authUi.manageAccountChangePasswordBtn = document.getElementById(
		"manageAccountChangePasswordBtn",
	)
	authUi.manageAccountResetPasswordBtn = document.getElementById(
		"manageAccountResetPasswordBtn",
	)
	authUi.manageAccountThemeSelect = document.getElementById(
		"manageAccountThemeSelect",
	)
	authUi.manageAccountFontSizeSelect = document.getElementById(
		"manageAccountFontSizeSelect",
	)
	authUi.manageAccountHighContrast = document.getElementById(
		"manageAccountHighContrast",
	)
	authUi.manageAccountReducedMotion = document.getElementById(
		"manageAccountReducedMotion",
	)
	authUi.manageAccountNotifEmail = document.getElementById(
		"manageAccountNotifEmail",
	)
	authUi.manageAccountNotifSms = document.getElementById(
		"manageAccountNotifSms",
	)
	authUi.manageAccountNotifPush = document.getElementById(
		"manageAccountNotifPush",
	)
	authUi.manageAccountSavePreferencesBtn = document.getElementById(
		"manageAccountSavePreferencesBtn",
	)
	authUi.manageAccountDeleteBtn = document.getElementById(
		"manageAccountDeleteBtn",
	)
}

function getStoredNotificationPrefs() {
	try {
		const parsed = JSON.parse(
			localStorage.getItem(MANAGE_ACCOUNT_LOCAL_KEYS.notifications) || "{}",
		)
		return {
			email: parsed.email !== false,
			sms: parsed.sms === true,
			push: parsed.push !== false,
		}
	} catch (_error) {
		return { email: true, sms: false, push: true }
	}
}

function saveNotificationPrefs(prefs = {}) {
	localStorage.setItem(
		MANAGE_ACCOUNT_LOCAL_KEYS.notifications,
		JSON.stringify({
			email: prefs.email === true,
			sms: prefs.sms === true,
			push: prefs.push === true,
		}),
	)
}

function getStoredAccessibilityPrefs() {
	try {
		const parsed = JSON.parse(
			localStorage.getItem(MANAGE_ACCOUNT_LOCAL_KEYS.accessibility) || "{}",
		)
		const fontSize = ["normal", "large", "xlarge"].includes(parsed.fontSize)
			? parsed.fontSize
			: "normal"
		return {
			highContrast: parsed.highContrast === true,
			reducedMotion: parsed.reducedMotion === true,
			fontSize,
		}
	} catch (_error) {
		return { highContrast: false, reducedMotion: false, fontSize: "normal" }
	}
}

function applyAccessibilityPrefs(prefs = {}) {
	document.body.classList.toggle("high-contrast", prefs.highContrast === true)
	document.body.classList.toggle("reduced-motion", prefs.reducedMotion === true)
	document.body.classList.remove("font-large", "font-xlarge")
	if (prefs.fontSize === "large") document.body.classList.add("font-large")
	if (prefs.fontSize === "xlarge") document.body.classList.add("font-xlarge")
}

function saveAccessibilityPrefs(prefs = {}) {
	localStorage.setItem(
		MANAGE_ACCOUNT_LOCAL_KEYS.accessibility,
		JSON.stringify({
			highContrast: prefs.highContrast === true,
			reducedMotion: prefs.reducedMotion === true,
			fontSize: ["normal", "large", "xlarge"].includes(prefs.fontSize)
				? prefs.fontSize
				: "normal",
		}),
	)
	applyAccessibilityPrefs(prefs)
}

function isValidEmailFormat(value = "") {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())
}

function isValidPhoneFormat(value = "") {
	if (!value) return true
	return /^\+?[0-9][0-9\s-]{6,18}$/.test(String(value).trim())
}

function evaluatePasswordRules(value = "") {
	const password = String(value || "")
	const rules = {
		length: password.length >= 8,
		upper: /[A-Z]/.test(password),
		lower: /[a-z]/.test(password),
		number: /\d/.test(password),
	}
	const score = Object.values(rules).filter(Boolean).length
	return { rules, score }
}

function updateManageHintState(field, hintEl, isValid, validText, invalidText) {
	if (!field || !hintEl) return
	field.classList.toggle("manage-field-valid", Boolean(isValid))
	field.classList.toggle("manage-field-invalid", !Boolean(isValid))
	hintEl.classList.toggle("is-valid", Boolean(isValid))
	hintEl.classList.toggle("is-invalid", !Boolean(isValid))
	hintEl.textContent = isValid ? validText : invalidText
}

function updateManagePasswordStrengthUI(password = "") {
	const { rules, score } = evaluatePasswordRules(password)
	if (authUi.managePasswordChecks) {
		authUi.managePasswordChecks
			.querySelectorAll("li[data-rule]")
			.forEach((item) => {
				const key = item.dataset.rule
				item.classList.toggle("met", Boolean(rules[key]))
			})
	}

	const pct = Math.min(100, Math.max(0, score * 25))
	if (authUi.managePasswordStrengthFill) {
		authUi.managePasswordStrengthFill.style.width = `${pct}%`
		authUi.managePasswordStrengthFill.classList.remove(
			"strength-weak",
			"strength-medium",
			"strength-strong",
		)
		authUi.managePasswordStrengthFill.classList.add(
			score <= 1
				? "strength-weak"
				: score <= 3
					? "strength-medium"
					: "strength-strong",
		)
	}
	if (authUi.managePasswordStrengthText) {
		authUi.managePasswordStrengthText.textContent =
			score <= 1
				? "Strength: Too weak"
				: score <= 3
					? "Strength: Medium"
					: "Strength: Strong"
	}
}

function setManageAvatarPreview(user) {
	if (!authUi.manageAccountAvatarPreview || !authUi.manageAccountAvatarInitial)
		return
	const existingImg = authUi.manageAccountAvatarPreview.querySelector("img")
	if (existingImg) existingImg.remove()
	const initial = (getUserDisplayName(user).charAt(0) || "R").toUpperCase()
	authUi.manageAccountAvatarInitial.textContent = initial
	if (user?.photoURL) {
		const img = document.createElement("img")
		img.src = user.photoURL
		img.alt = "Profile"
		authUi.manageAccountAvatarPreview.appendChild(img)
		authUi.manageAccountAvatarInitial.style.display = "none"
	} else {
		authUi.manageAccountAvatarInitial.style.display = "inline-flex"
	}
}

function loadManageAccountForm(user) {
	if (!user) return
	if (authUi.manageAccountName)
		authUi.manageAccountName.value =
			user.displayName || getUserDisplayName(user)
	if (authUi.manageAccountEmail)
		authUi.manageAccountEmail.value = user.email || ""
	if (authUi.manageAccountPhone) {
		const dashboardPhoneText = String(
			authUi.dashboardProfilePhone?.textContent || "",
		).trim()
		authUi.manageAccountPhone.value =
			dashboardPhoneText === "Add phone during booking"
				? ""
				: dashboardPhoneText
	}
	setManageAvatarPreview(user)

	if (authUi.manageAccountThemeSelect) {
		authUi.manageAccountThemeSelect.value = isDark ? "dark" : "light"
	}
	const access = getStoredAccessibilityPrefs()
	if (authUi.manageAccountFontSizeSelect)
		authUi.manageAccountFontSizeSelect.value = access.fontSize
	if (authUi.manageAccountHighContrast)
		authUi.manageAccountHighContrast.checked = access.highContrast
	if (authUi.manageAccountReducedMotion)
		authUi.manageAccountReducedMotion.checked = access.reducedMotion

	const notif = getStoredNotificationPrefs()
	if (authUi.manageAccountNotifEmail)
		authUi.manageAccountNotifEmail.checked = notif.email
	if (authUi.manageAccountNotifSms)
		authUi.manageAccountNotifSms.checked = notif.sms
	if (authUi.manageAccountNotifPush)
		authUi.manageAccountNotifPush.checked = notif.push

	if (authUi.manageAccountEmail && authUi.manageAccountEmailHint) {
		updateManageHintState(
			authUi.manageAccountEmail,
			authUi.manageAccountEmailHint,
			isValidEmailFormat(authUi.manageAccountEmail.value),
			"✅ Email looks good.",
			"Use a valid email format (e.g. name@example.com).",
		)
	}
	if (authUi.manageAccountPhone && authUi.manageAccountPhoneHint) {
		updateManageHintState(
			authUi.manageAccountPhone,
			authUi.manageAccountPhoneHint,
			isValidPhoneFormat(authUi.manageAccountPhone.value),
			"✅ Phone format looks good.",
			"Use digits with optional +, spaces, or dashes.",
		)
	}
	updateManagePasswordStrengthUI(authUi.manageAccountNewPassword?.value || "")
}

function openManageAccountModal() {
	if (!isNonGuestSignedIn()) {
		openAuthModal("signin")
		return
	}
	if (authUi.manageAccountMessage) clearFormMessage(authUi.manageAccountMessage)
	loadManageAccountForm(auth.currentUser)
	if (authUi.manageAccountModal) {
		authUi.manageAccountModal.classList.add("active")
		authUi.manageAccountModal.setAttribute("aria-hidden", "false")
		document.body.style.overflow = "hidden"
	}
}

function closeManageAccountModal() {
	if (authUi.manageAccountModal) {
		authUi.manageAccountModal.classList.remove("active")
		authUi.manageAccountModal.setAttribute("aria-hidden", "true")
		document.body.style.overflow = ""
	}
}

async function handleManageAccountSaveProfile() {
	if (!appServicesReady || !auth?.currentUser) return
	const user = auth.currentUser
	const name = authUi.manageAccountName?.value?.trim() || ""
	const email = authUi.manageAccountEmail?.value?.trim() || ""
	const nextEmailLower = email.toLowerCase()
	const phone = authUi.manageAccountPhone?.value?.trim() || ""
	const avatarFile = authUi.manageAccountAvatarInput?.files?.[0] || null
	const previousDisplayName = String(user.displayName || "").trim()
	const previousEmail = String(user.email || "")
		.trim()
		.toLowerCase()
	const previousPhoneLabel = String(
		authUi.dashboardProfilePhone?.textContent || "",
	).trim()
	const previousPhone =
		previousPhoneLabel === "Add phone during booking" ? "" : previousPhoneLabel
	const didChangeDisplayName = Boolean(name && name !== previousDisplayName)
	const didChangeEmail = Boolean(
		nextEmailLower && nextEmailLower !== previousEmail,
	)
	const didChangePhone = phone !== previousPhone
	const didChangeAvatar = Boolean(avatarFile)
	if (!isValidEmailFormat(email)) {
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"error",
			"❌ Please enter a valid email address.",
		)
		return
	}
	if (!isValidPhoneFormat(phone)) {
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"error",
			"❌ Please enter a valid phone number format.",
		)
		return
	}

	const btn = authUi.manageAccountSaveProfileBtn
	if (btn) {
		setButtonLoadingState(btn, true, {
			loadingText: "Saving...",
		})
	}

	try {
		const profileUpdate = {}
		if (name && name !== (user.displayName || ""))
			profileUpdate.displayName = name
		if (avatarFile) {
			if (avatarFile.size > 5 * 1024 * 1024) {
				throw new Error("Profile picture must be 5MB or less.")
			}
			const uploadedUrl = await uploadImageToCloudinary(avatarFile, {
				purpose: "profile-avatar",
				tags: ["public_upload", "profile_avatar"],
				context: { section: "manage_account" },
			})
			if (uploadedUrl) profileUpdate.photoURL = uploadedUrl
		}
		if (Object.keys(profileUpdate).length) {
			await user.updateProfile(profileUpdate)
		}
		if (email && nextEmailLower !== previousEmail) {
			await user.updateEmail(email)
		}
		await upsertUserProfile(user, {
			displayName: name || user.displayName || getUserDisplayName(user),
			email: email || user.email || "",
			phone,
		})
		setDashboardSignedInState(auth.currentUser)
		if (authUi.dashboardProfilePhone && phone) {
			authUi.dashboardProfilePhone.textContent = phone
		}
		setManageAvatarPreview(auth.currentUser)
		if (authUi.manageAccountAvatarInput) {
			authUi.manageAccountAvatarInput.value = ""
		}

		const changeTrackPromises = []
		if (didChangeEmail) {
			changeTrackPromises.push(
				trackAccountSecurityChange({
					changeType: "email_changed",
					details: `Email changed to ${email}`,
					context: { source: "manage-account-profile" },
				}),
			)
		}
		if (didChangePhone) {
			changeTrackPromises.push(
				trackAccountSecurityChange({
					changeType: "phone_changed",
					details: "Phone number updated",
					context: { source: "manage-account-profile" },
				}),
			)
		}
		if (didChangeDisplayName || didChangeAvatar) {
			const profileChangeDetails = [
				didChangeDisplayName ? "display name" : "",
				didChangeAvatar ? "avatar" : "",
			]
				.filter(Boolean)
				.join(" + ")
			changeTrackPromises.push(
				trackAccountSecurityChange({
					changeType: "profile_updated",
					details: `Profile updated (${profileChangeDetails || "general"})`,
					context: { source: "manage-account-profile" },
				}),
			)
		}
		if (changeTrackPromises.length) {
			await Promise.allSettled(changeTrackPromises)
		}

		showTimedFormMessage(
			authUi.manageAccountMessage,
			"success",
			"✅ Profile updated successfully.",
		)
	} catch (error) {
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"error",
			`❌ ${getFriendlyAuthError(error)}`,
		)
	} finally {
		if (btn) {
			setButtonLoadingState(btn, false, {
				resetText: "Save Profile",
			})
		}
	}
}

async function handleManageAccountChangePassword() {
	if (!appServicesReady || !auth?.currentUser) return
	const user = auth.currentUser
	const currentPassword = authUi.manageAccountCurrentPassword?.value || ""
	const newPassword = authUi.manageAccountNewPassword?.value || ""
	const passwordRules = evaluatePasswordRules(newPassword)

	if (!currentPassword || !newPassword || passwordRules.score < 4) {
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"error",
			"❌ New password must be 8+ chars with upper, lower, and number.",
		)
		return
	}

	const btn = authUi.manageAccountChangePasswordBtn
	if (btn) {
		setButtonLoadingState(btn, true, {
			loadingText: "Updating...",
		})
	}

	try {
		if (!user.email) {
			throw new Error("Email account required for password change.")
		}
		const credential = createEmailCredential(user.email, currentPassword)
		await user.reauthenticateWithCredential(credential)
		await user.updatePassword(newPassword)
		if (authUi.manageAccountCurrentPassword)
			authUi.manageAccountCurrentPassword.value = ""
		if (authUi.manageAccountNewPassword)
			authUi.manageAccountNewPassword.value = ""
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"success",
			"✅ Password changed securely.",
		)
		await trackAccountSecurityChange({
			changeType: "password_changed",
			details: "Account password changed",
			context: { source: "manage-account-password" },
		})
	} catch (error) {
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"error",
			`❌ ${getFriendlyAuthError(error)}`,
		)
	} finally {
		if (btn) {
			setButtonLoadingState(btn, false, {
				resetText: "Change Password",
			})
		}
	}
}

async function handleManageAccountResetPassword() {
	if (!appServicesReady || !auth) return
	const email =
		authUi.manageAccountEmail?.value?.trim() || auth.currentUser?.email || ""
	if (!email) {
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"error",
			"❌ No email found to send reset link.",
		)
		return
	}
	if (!isValidEmailFormat(email)) {
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"error",
			"❌ Please enter a valid email before requesting reset.",
		)
		return
	}
	try {
		await auth.sendPasswordResetEmail(email)
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"success",
			"✅ Password reset email sent.",
		)
	} catch (error) {
		showTimedFormMessage(
			authUi.manageAccountMessage,
			"error",
			`❌ ${getFriendlyAuthError(error)}`,
		)
	}
}

function handleManageAccountSavePreferences() {
	const theme =
		authUi.manageAccountThemeSelect?.value === "light" ? "light" : "dark"
	isDark = theme === "dark"
	localStorage.setItem("theme", isDark ? "dark" : "light")
	applyTheme()

	const accessibility = {
		highContrast: authUi.manageAccountHighContrast?.checked === true,
		reducedMotion: authUi.manageAccountReducedMotion?.checked === true,
		fontSize: authUi.manageAccountFontSizeSelect?.value || "normal",
	}
	saveAccessibilityPrefs(accessibility)

	const notifications = {
		email: authUi.manageAccountNotifEmail?.checked === true,
		sms: authUi.manageAccountNotifSms?.checked === true,
		push: authUi.manageAccountNotifPush?.checked === true,
	}
	saveNotificationPrefs(notifications)

	showTimedFormMessage(
		authUi.manageAccountMessage,
		"success",
		"✅ Preferences saved.",
	)
}

function hideAccountDeletedPopup() {
	if (!authUi.accountDeleteSuccessPopup) return
	authUi.accountDeleteSuccessPopup.classList.remove("show")
	if (accountDeletePopupTimer) {
		clearTimeout(accountDeletePopupTimer)
		accountDeletePopupTimer = null
	}
}

function showAccountDeletedPopup() {
	if (!authUi.accountDeleteSuccessPopup) return
	authUi.accountDeleteSuccessPopup.classList.add("show")
	if (accountDeletePopupTimer) {
		clearTimeout(accountDeletePopupTimer)
	}
	accountDeletePopupTimer = setTimeout(() => {
		hideAccountDeletedPopup()
	}, 4200)
}

function closeDeleteAccountConfirmModal(confirmed = false) {
	const modal = authUi.deleteAccountConfirmModal
	if (modal) {
		if (deleteAccountConfirmCloseTimer) {
			clearTimeout(deleteAccountConfirmCloseTimer)
			deleteAccountConfirmCloseTimer = null
		}

		modal.classList.remove("active")
		modal.classList.add("is-closing")
		modal.setAttribute("aria-hidden", "true")

		deleteAccountConfirmCloseTimer = setTimeout(() => {
			modal.classList.remove("is-closing")
			deleteAccountConfirmCloseTimer = null
		}, 230)
	}

	if (pendingDeleteAccountResolver) {
		pendingDeleteAccountResolver(Boolean(confirmed))
		pendingDeleteAccountResolver = null
	}
}

function openDeleteAccountConfirmModal() {
	return new Promise((resolve) => {
		if (!authUi.deleteAccountConfirmModal) {
			resolve(false)
			return
		}

		if (pendingDeleteAccountResolver) {
			pendingDeleteAccountResolver(false)
		}
		pendingDeleteAccountResolver = resolve

		if (deleteAccountConfirmCloseTimer) {
			clearTimeout(deleteAccountConfirmCloseTimer)
			deleteAccountConfirmCloseTimer = null
		}

		if (authUi.deleteAccountConfirmMessage) {
			authUi.deleteAccountConfirmMessage.textContent =
				"This action is permanent and cannot be undone."
		}

		authUi.deleteAccountConfirmModal.classList.remove("is-closing")
		authUi.deleteAccountConfirmModal.classList.add("active")
		authUi.deleteAccountConfirmModal.setAttribute("aria-hidden", "false")
	})
}

function updateReviewAuthHintVisibility() {
	if (!authUi.reviewAuthHint) return
	authUi.reviewAuthHint.classList.toggle("hidden", isNonGuestSignedIn())
}

function updateReviewSubmissionVisibility() {
	const canSubmitReview = isNonGuestSignedIn()
	if (authUi.reviewSubmitWrap) {
		authUi.reviewSubmitWrap.classList.toggle("hidden", !canSubmitReview)
	}
	if (authUi.reviewSubmitAuthGate) {
		authUi.reviewSubmitAuthGate.classList.toggle("hidden", canSubmitReview)
	}
}

function showFavoritesToast(message = "") {
	if (!authUi.favoritesToast || !message) return
	authUi.favoritesToast.textContent = message
	authUi.favoritesToast.classList.add("show")
	if (favoritesToastTimer) {
		clearTimeout(favoritesToastTimer)
	}
	favoritesToastTimer = setTimeout(() => {
		authUi.favoritesToast?.classList.remove("show")
		favoritesToastTimer = null
	}, 1800)
}

function showTimedDashboardFavoritesMessage(type, text, duration = 2600) {
	if (!authUi.dashboardMessage) return

	if (dashboardFavoritesMessageTimer) {
		clearTimeout(dashboardFavoritesMessageTimer)
		dashboardFavoritesMessageTimer = null
	}

	showFormMessage(authUi.dashboardMessage, type, text)

	dashboardFavoritesMessageTimer = setTimeout(() => {
		hideReviewMessage(authUi.dashboardMessage, true)
		dashboardFavoritesMessageTimer = null
	}, duration)
}

function showTimedAuthMessage(type, text, duration = 4200) {
	if (!authUi.message) return

	if (authMessageTimer) {
		clearTimeout(authMessageTimer)
		authMessageTimer = null
	}

	showFormMessage(authUi.message, type, text)
	authMessageTimer = setTimeout(() => {
		hideReviewMessage(authUi.message, true)
		authMessageTimer = null
	}, duration)
}

function setAuthPasswordVisibility(isVisible) {
	if (!authUi.passwordInput || !authUi.passwordToggleBtn) return

	const shouldShow = isVisible === true
	authUi.passwordInput.type = shouldShow ? "text" : "password"
	authUi.passwordToggleBtn.setAttribute(
		"aria-label",
		shouldShow ? "Hide password" : "Show password",
	)
	authUi.passwordToggleBtn.setAttribute(
		"aria-pressed",
		shouldShow ? "true" : "false",
	)

	const icon = authUi.passwordToggleBtn.querySelector("i")
	if (icon) {
		icon.classList.toggle("fa-eye", !shouldShow)
		icon.classList.toggle("fa-eye-slash", shouldShow)
	}
}

function setManagePasswordVisibility(
	inputEl,
	toggleEl,
	isVisible = false,
	fieldLabel = "password",
) {
	if (!inputEl || !toggleEl) return

	const shouldShow = isVisible === true
	inputEl.type = shouldShow ? "text" : "password"
	toggleEl.setAttribute(
		"aria-label",
		`${shouldShow ? "Hide" : "Show"} ${fieldLabel}`,
	)
	toggleEl.setAttribute("aria-pressed", shouldShow ? "true" : "false")

	const icon = toggleEl.querySelector("i")
	if (icon) {
		icon.classList.toggle("fa-eye", !shouldShow)
		icon.classList.toggle("fa-eye-slash", shouldShow)
	}
}

function clearRegisterPromptHighlight() {
	authUi.switchToSignupBtn?.classList.remove("auth-register-highlight")
	authUi.switchToSignupBtn?.removeAttribute("aria-live")
}

function promptRegisterForMissingAccount() {
	setAuthMode("signin")
	const registerBtn = authUi.switchToSignupBtn
	if (!registerBtn) return

	registerBtn.classList.remove("auth-register-highlight")
	void registerBtn.offsetWidth
	registerBtn.classList.add("auth-register-highlight")
	registerBtn.setAttribute("aria-live", "polite")

	try {
		registerBtn.focus({ preventScroll: true })
	} catch (_error) {
		registerBtn.focus()
	}
}

function setPostBookingPromptVisible(isVisible) {
	if (!authUi.postBookingAuthPrompt) return
	authUi.postBookingAuthPrompt.classList.toggle("hidden", !isVisible)
}

function setAuthMode(mode = "signin") {
	authMode = mode === "signup" ? "signup" : "signin"
	clearRegisterPromptHighlight()
	if (authUi.nameGroup) {
		authUi.nameGroup.style.display = authMode === "signup" ? "block" : "none"
	}
	if (authUi.submitBtn) {
		authUi.submitBtn.textContent =
			authMode === "signup" ? "Create Account" : "Log In"
	}
	if (authUi.switchToSignupBtn) {
		authUi.switchToSignupBtn.classList.toggle("hidden", authMode === "signup")
	}
	if (authUi.switchToSigninBtn) {
		authUi.switchToSigninBtn.classList.toggle("hidden", authMode !== "signup")
	}
	if (authUi.passwordInput) {
		authUi.passwordInput.setAttribute(
			"autocomplete",
			authMode === "signup" ? "new-password" : "current-password",
		)
	}
	setAuthPasswordVisibility(false)
}

function openAuthModal(defaultMode = "signin") {
	setAuthMode(defaultMode)
	if (authUi.message) clearFormMessage(authUi.message)
	if (authUi.modal) {
		authUi.modal.classList.add("active")
		authUi.modal.setAttribute("aria-hidden", "false")
		document.body.style.overflow = "hidden"
	}
}

function closeAuthModal() {
	if (authUi.modal) {
		authUi.modal.classList.remove("active")
		authUi.modal.setAttribute("aria-hidden", "true")
		document.body.style.overflow = ""
	}
}

function closeAuthProfileMenu({ delay = 0 } = {}) {
	const closeMenu = () => {
		if (authUi.profileMenu) authUi.profileMenu.classList.remove("open")
		if (authUi.profileTrigger) {
			authUi.profileTrigger.setAttribute("aria-expanded", "false")
		}
	}

	if (delay > 0) {
		window.setTimeout(closeMenu, delay)
		return
	}

	closeMenu()
}

function getUserDisplayName(user) {
	if (!user) return "Guest User"
	if (user.displayName && user.displayName.trim())
		return user.displayName.trim()
	if (user.email && user.email.includes("@")) {
		return user.email.split("@")[0]
	}
	return "Royal Braids Client"
}

function setHeaderProfileAvatar(user) {
	if (!authUi.profileTrigger || !authUi.profileInitial) return

	const existingImg = authUi.profileTrigger.querySelector("img")
	if (existingImg) existingImg.remove()

	const displayName = getUserDisplayName(user)
	authUi.profileInitial.textContent = (
		displayName.charAt(0) || "R"
	).toUpperCase()

	if (user?.photoURL) {
		const img = document.createElement("img")
		img.src = user.photoURL
		img.alt = `${displayName} profile photo`
		img.loading = "lazy"
		authUi.profileTrigger.appendChild(img)
		authUi.profileInitial.style.display = "none"
	} else {
		authUi.profileInitial.style.display = "inline-flex"
	}
}

function setDashboardPromptState() {
	stopDashboardFavoritesListener()
	stopDashboardBookingsListener()
	stopDashboardRescheduleAvailabilityListener()
	closeDashboardRescheduleModal()
	dashboardFavoriteStyles = []
	dashboardBookingDocs = []
	activeDashboardUid = ""
	if (authUi.clientDashboard) authUi.clientDashboard.classList.add("hidden")
	if (authUi.navDashboardLink) authUi.navDashboardLink.classList.add("hidden")
	if (authUi.openBtn) authUi.openBtn.classList.remove("hidden")
	closeAuthProfileMenu()
	if (authUi.profileMenu) authUi.profileMenu.classList.add("hidden")
	setHeaderProfileAvatar(null)
	if (authUi.dashboardProfileName)
		authUi.dashboardProfileName.textContent = "Guest User"
	if (authUi.dashboardProfileEmail)
		authUi.dashboardProfileEmail.textContent = "Not signed in"
	if (authUi.dashboardProfilePhone)
		authUi.dashboardProfilePhone.textContent = "Add phone during booking"
	if (authUi.dashboardAuthBtn) {
		authUi.dashboardAuthBtn.textContent = "Log In to Sync Data"
	}
	if (authUi.dashboardDeleteAccountBtn) {
		authUi.dashboardDeleteAccountBtn.classList.add("hidden")
		authUi.dashboardDeleteAccountBtn.disabled = false
		authUi.dashboardDeleteAccountBtn.textContent = "Delete Account"
	}
	closeManageAccountModal()
	if (dashboardFavoritesMessageTimer) {
		clearTimeout(dashboardFavoritesMessageTimer)
		dashboardFavoritesMessageTimer = null
	}
	renderDashboardFavorites(
		authUi.dashboardFavoritesList,
		[],
		"Log in to save favorite gallery styles.",
	)
	if (authUi.dashboardFavoritesCount)
		authUi.dashboardFavoritesCount.textContent = "0"
	updateFavoriteButtonsUI()
	setPostBookingPromptVisible(false)
	updateReviewSubmissionVisibility()
}

function setDashboardSignedInState(user) {
	if (authUi.clientDashboard) authUi.clientDashboard.classList.remove("hidden")
	if (authUi.navDashboardLink)
		authUi.navDashboardLink.classList.remove("hidden")
	if (authUi.openBtn) authUi.openBtn.classList.add("hidden")
	if (authUi.profileMenu) authUi.profileMenu.classList.remove("hidden")

	const displayName = getUserDisplayName(user)
	const initial = displayName.charAt(0).toUpperCase() || "R"

	if (authUi.profileName) authUi.profileName.textContent = displayName
	if (authUi.profileInitial) authUi.profileInitial.textContent = initial
	setHeaderProfileAvatar(user)
	if (authUi.dashboardProfileName)
		authUi.dashboardProfileName.textContent = displayName
	if (authUi.dashboardProfileEmail)
		authUi.dashboardProfileEmail.textContent = user?.email || "No email"
	if (authUi.dashboardAuthBtn) {
		authUi.dashboardAuthBtn.textContent = "Manage Account"
	}
	if (authUi.dashboardDeleteAccountBtn) {
		authUi.dashboardDeleteAccountBtn.classList.remove("hidden")
		authUi.dashboardDeleteAccountBtn.disabled = false
		authUi.dashboardDeleteAccountBtn.textContent = "Delete Account"
	}
	updateReviewSubmissionVisibility()
	setPostBookingPromptVisible(false)
}

function focusDashboardAfterAuthIfRequested() {
	if (!shouldAutoFocusDashboardAfterAuth) return
	shouldAutoFocusDashboardAfterAuth = false

	if (authUi.clientDashboard) {
		scrollToMainSection("#clientDashboard", { behavior: "smooth" })
		authUi.clientDashboard.setAttribute("tabindex", "-1")
		authUi.clientDashboard.focus({ preventScroll: true })
	}
}

async function upsertUserProfile(user, extras = {}) {
	if (!appServicesReady || !db || !user?.uid) return
	const safeDisplayName =
		(user.displayName || extras.displayName || "").trim() ||
		getUserDisplayName(user)
	const providerId =
		user.providerData?.[0]?.providerId || extras.provider || "unknown"
	const emailValue = user.email || extras.email || ""
	const phoneValue =
		typeof extras.phone === "string"
			? extras.phone
			: (user.phoneNumber && String(user.phoneNumber)) || ""
	await db.collection("users").doc(user.uid).set(
		{
			displayName: safeDisplayName,
			email: emailValue,
			provider: providerId,
			phone: phoneValue,
			updatedAt: getServerTimestamp(),
			createdAt: getServerTimestamp(),
		},
		{ merge: true },
	)
}

function renderDashboardList(mount, items, emptyText) {
	if (!mount) return
	if (!Array.isArray(items) || !items.length) {
		mount.innerHTML = `<li>${emptyText}</li>`
		return
	}
	mount.innerHTML = items.map((item) => `<li>${item}</li>`).join("")
}

function getSecurityStatusLabel(status = "") {
	const normalized = String(status || "")
		.trim()
		.toLowerCase()
	return normalized === "failure" ? "Failed" : "Success"
}

function getSecurityMethodLabel(method = "") {
	const normalized = String(method || "")
		.trim()
		.toLowerCase()
	if (normalized === "google") return "Google"
	if (
		normalized === "email/password" ||
		normalized === "password" ||
		normalized === "email"
	) {
		return "Email/Password"
	}
	if (normalized === "anonymous") return "Anonymous"
	return "Unknown"
}

function renderDashboardLoginHistory(items = []) {
	if (authUi.dashboardLoginHistoryCount) {
		authUi.dashboardLoginHistoryCount.textContent = String(items.length || 0)
	}

	const mount = authUi.dashboardLoginHistoryList
	if (!mount) return

	if (!Array.isArray(items) || !items.length) {
		mount.innerHTML =
			"<li>No login history yet. Your future sign-ins will appear here.</li>"
		return
	}

	mount.innerHTML = items
		.map((item) => {
			const statusLabel = getSecurityStatusLabel(item.status)
			const methodLabel = getSecurityMethodLabel(item.method)
			const dateLabel = formatDateTime(item.createdAt)
			const device = String(item.deviceType || "Unknown").trim()
			const browser = String(item.browser || "Unknown").trim()
			const location =
				String(item.locationLabel || "").trim() ||
				[
					String(item.locationCity || "").trim(),
					String(item.locationCountry || "").trim(),
				]
					.filter(Boolean)
					.join(", ") ||
				"Unknown"

			return `<li>${escapeHtml(dateLabel)} • ${escapeHtml(statusLabel)} • ${escapeHtml(methodLabel)} • ${escapeHtml(device)} / ${escapeHtml(browser)} • ${escapeHtml(location)}</li>`
		})
		.join("")
}

function formatOrdinalPosition(value = 0) {
	const n = Math.max(0, Number(value || 0))
	if (!n) return ""
	const mod100 = n % 100
	if (mod100 >= 11 && mod100 <= 13) return `${n}th`
	switch (n % 10) {
		case 1:
			return `${n}st`
		case 2:
			return `${n}nd`
		case 3:
			return `${n}rd`
		default:
			return `${n}th`
	}
}

function normalizeDashboardWaitlistStatus(status = "") {
	const raw = String(status || "waiting")
		.trim()
		.toLowerCase()
	if (raw === "waitlist" || raw === "waitlisted") return "waiting"
	if (raw === "canceled") return "cancelled"
	if (
		[
			"waiting",
			"notified",
			"contacted",
			"booked",
			"cancelled",
			"notification_failed",
		].includes(raw)
	) {
		return raw
	}
	return "waiting"
}

function isActiveDashboardWaitlistQueueStatus(status = "") {
	return ["waiting", "notified", "contacted", "notification_failed"].includes(
		normalizeDashboardWaitlistStatus(status),
	)
}

function getDashboardWaitlistQueueKey(booking = {}) {
	const slotId = String(
		booking.preferredSlotId || booking.slotId || booking.selectedSlotId || "",
	).trim()
	if (slotId) return `slot:${slotId}`
	return [
		String(booking.date || booking.preferredDate || "").trim(),
		String(booking.time || booking.preferredTime || "").trim(),
		normalizeStylistKey(booking.stylistKey || booking.stylist || "any"),
	]
		.join("|")
		.toLowerCase()
}

function getDashboardWaitlistQueueInfoFromBooking(booking = {}) {
	const position = Number(booking.waitlistPosition || 0) || null
	const label = String(booking.waitlistPositionLabel || "").trim()
	const size = Number(booking.waitlistQueueSize || 0) || null
	return {
		position,
		label,
		size,
		hasInfo: Boolean(position || label || size),
	}
}

function applyDashboardWaitlistQueueInfo(booking = {}, queueInfo = {}) {
	const status = normalizeDashboardWaitlistStatus(
		queueInfo.status || booking.waitlistStatus || "waiting",
	)
	const active = isActiveDashboardWaitlistQueueStatus(status)
	const position = active ? Number(queueInfo.position || 0) || null : null
	const label = active ? String(queueInfo.label || "").trim() : ""
	const size = active ? Number(queueInfo.size || 0) || null : null

	return {
		...booking,
		waitlistStatus: status,
		waitlistPosition: position,
		waitlistPositionLabel: label || formatOrdinalPosition(position),
		waitlistQueueSize: size,
		__dashboardQueueInfoHydrated: true,
	}
}

async function getDashboardWaitlistDocQueueInfo(waitlistId = "") {
	const safeWaitlistId = String(waitlistId || "").trim()
	if (!appServicesReady || !db || !safeWaitlistId) return null

	const snapshot = await db.collection("waitlist").doc(safeWaitlistId).get()
	if (!snapshot.exists) return null
	const data = snapshot.data() || {}
	return {
		position: Number(data.queuePosition || 0) || null,
		label: String(data.queuePositionLabel || "").trim(),
		size: Number(data.queueSize || 0) || null,
		status: normalizeDashboardWaitlistStatus(data.status),
		source: "waitlist-doc",
	}
}

function hasUsableDashboardQueueInfo(queueInfo = {}) {
	return Boolean(
		Number(queueInfo.position || 0) ||
		String(queueInfo.label || "").trim() ||
		Number(queueInfo.size || 0),
	)
}

async function hydrateDashboardWaitlistQueueInfo(bookings = []) {
	const items = Array.isArray(bookings)
		? bookings.map((booking) => ({ ...booking }))
		: []
	const waitlistedBookings = items.filter(
		(booking) =>
			normalizeBookingStatus(booking.status) === "waitlisted" &&
			String(booking.waitlistId || "").trim(),
	)

	if (!waitlistedBookings.length) return items

	await Promise.all(
		waitlistedBookings.map(async (booking) => {
			const waitlistId = String(booking.waitlistId || "").trim()
			const bookingId = String(booking.id || "").trim()
			let docQueueInfo = null
			let liveQueueInfo = null

			try {
				docQueueInfo = await getDashboardWaitlistDocQueueInfo(waitlistId)
			} catch (error) {
				console.warn("Dashboard waitlist document lookup failed:", error)
			}

			try {
				liveQueueInfo = await callClientGetWaitlistQueueInfoAction({
					bookingId,
					waitlistId,
				})
			} catch (error) {
				console.warn("Live dashboard waitlist queue lookup failed:", error)
			}

			const preferredQueueInfo = hasUsableDashboardQueueInfo(liveQueueInfo)
				? liveQueueInfo
				: liveQueueInfo?.active === false
					? liveQueueInfo
					: hasUsableDashboardQueueInfo(docQueueInfo) || docQueueInfo?.status
						? docQueueInfo
						: null

			if (preferredQueueInfo) {
				Object.assign(
					booking,
					applyDashboardWaitlistQueueInfo(booking, preferredQueueInfo),
				)
			}
		}),
	)

	return items
}

function enrichDashboardWaitlistPositions(bookings = []) {
	const items = Array.isArray(bookings) ? [...bookings] : []
	const queueMap = new Map()

	items.forEach((booking) => {
		const status = normalizeBookingStatus(booking?.status)
		if (status !== "waitlisted") return
		booking.waitlistStatus = normalizeDashboardWaitlistStatus(
			booking.waitlistStatus || "waiting",
		)
		if (!isActiveDashboardWaitlistQueueStatus(booking.waitlistStatus)) {
			booking.waitlistPosition = null
			booking.waitlistPositionLabel = ""
			booking.waitlistQueueSize = null
			return
		}

		const existingInfo = getDashboardWaitlistQueueInfoFromBooking(booking)
		if (existingInfo.hasInfo) {
			booking.waitlistPosition = existingInfo.position
			booking.waitlistPositionLabel =
				existingInfo.label || formatOrdinalPosition(existingInfo.position)
			booking.waitlistQueueSize = existingInfo.size
			return
		}

		// Linked waitlist bookings should use the real waitlist queue document / callable
		// result. Falling back to only the current user's dashboard rows is what caused
		// every entry to appear as "1st in queue of 1" while admin showed the full queue.
		if (String(booking.waitlistId || "").trim()) return

		const key = getDashboardWaitlistQueueKey(booking)
		if (!queueMap.has(key)) queueMap.set(key, [])
		queueMap.get(key).push(booking)
	})

	queueMap.forEach((queueItems) => {
		queueItems.sort((a, b) => {
			const createdDiff =
				toTimestampMs(a.createdAt) - toTimestampMs(b.createdAt)
			if (createdDiff !== 0) return createdDiff
			return String(a.id || "").localeCompare(String(b.id || ""))
		})

		queueItems.forEach((booking, index) => {
			const calculatedPosition = index + 1
			const queueSize = queueItems.length
			const existingPosition = Number(booking.waitlistPosition || 0) || null
			const existingLabel = String(booking.waitlistPositionLabel || "").trim()

			booking.waitlistPosition = existingPosition || calculatedPosition
			booking.waitlistPositionLabel =
				existingLabel ||
				formatOrdinalPosition(existingPosition || calculatedPosition)
			booking.waitlistQueueSize =
				Number(booking.waitlistQueueSize || 0) || queueSize
		})
	})

	return items
}

function getDashboardWaitlistSummary(booking = {}) {
	const positionLabel = String(booking.waitlistPositionLabel || "").trim()
	const position = Number(booking.waitlistPosition || 0) || null
	const queueSize = Number(booking.waitlistQueueSize || 0) || null
	const label = positionLabel || formatOrdinalPosition(position)
	if (!label) return ""
	return queueSize ? `${label} of ${queueSize}` : label
}

function renderDashboardWaitlistQueueChip(booking = {}) {
	const positionLabel = String(booking.waitlistPositionLabel || "").trim()
	const position = Number(booking.waitlistPosition || 0) || null
	const queueSize = Number(booking.waitlistQueueSize || 0) || null
	const label = positionLabel || formatOrdinalPosition(position)
	if (!label) return ""

	const accessibleLabel = queueSize
		? `Waitlist place: ${label} of ${queueSize}`
		: `Waitlist place: ${label}`

	return `
		<span class="waitlist-queue-chip dashboard-waitlist-queue-chip" aria-label="${escapeHtml(accessibleLabel)}">
			<span class="waitlist-queue-chip__rank">${escapeHtml(label)}</span>
			<span class="waitlist-queue-chip__text">in queue</span>
			${queueSize ? `<span class="waitlist-queue-chip__size">of ${escapeHtml(queueSize)}</span>` : ""}
		</span>
	`
}

function normalizeBookingStatus(status = "") {
	const raw = String(status || "pending")
		.trim()
		.toLowerCase()
	if (raw === "complete") return "completed"
	if (raw === "canceled") return "cancelled"
	if (raw === "booked") return "confirmed"
	if (raw === "waitlist" || raw === "waiting") return "waitlisted"
	if (raw === "no-show" || raw === "no show" || raw === "noshow") {
		return "no_show"
	}
	if (raw === "in progress" || raw === "in_progress" || raw === "in-progress") {
		return "confirmed"
	}
	if (
		[
			"pending",
			"confirmed",
			"completed",
			"cancelled",
			"waitlisted",
			"expired",
			"no_show",
		].includes(raw)
	) {
		return raw
	}
	return "pending"
}

const KNOWN_STYLIST_KEYS = new Set([
	"any",
	"fatima",
	"zainab",
	"grace",
	"amina",
	"sarah",
])

const STYLIST_LABEL_BY_KEY = {
	any: "Any Available",
	fatima: "Fatima Hassan - Master Braider",
	zainab: "Zainab Mohamed - Senior Stylist",
	grace: "Grace Wanjiku - Natural Hair Expert",
	amina: "Amina Diallo - Braiding Specialist",
	sarah: "Sarah Omondi - Kids Specialist",
}

function normalizeStylistKey(value = "") {
	const raw = String(value || "")
		.trim()
		.toLowerCase()

	if (!raw || raw === "any" || raw === "any available") return "any"
	if (KNOWN_STYLIST_KEYS.has(raw)) return raw

	if (raw.includes("fatima")) return "fatima"
	if (raw.includes("zainab")) return "zainab"
	if (raw.includes("grace")) return "grace"
	if (raw.includes("amina")) return "amina"
	if (raw.includes("sarah")) return "sarah"

	return "any"
}

function getStylistDisplayName(value = "") {
	const key = normalizeStylistKey(value)
	return STYLIST_LABEL_BY_KEY[key] || STYLIST_LABEL_BY_KEY.any
}

function parseBookingDateTimeMs(dateValue = "", timeValue = "") {
	const rawDate = String(dateValue || "").trim()
	const rawTime = String(timeValue || "").trim()
	if (!rawDate || !rawTime) return 0
	const parsed = Date.parse(`${rawDate} ${rawTime}`)
	if (!Number.isNaN(parsed)) return parsed
	const parsedIso = Date.parse(`${rawDate}T${rawTime}`)
	return Number.isNaN(parsedIso) ? 0 : parsedIso
}

function isBookingActionable(booking = {}) {
	const status = normalizeBookingStatus(booking.status)
	if (!(status === "pending" || status === "confirmed")) return false
	const scheduledAt = parseBookingDateTimeMs(booking.date, booking.time)
	if (!scheduledAt) return true
	return scheduledAt > Date.now()
}

function getCurrentUserEmailForOwnership() {
	return String(auth?.currentUser?.email || "")
		.trim()
		.toLowerCase()
}

function isDashboardBookingOwnedByCurrentUser(booking = {}) {
	const currentUid = String(auth?.currentUser?.uid || "").trim()
	if (!currentUid) return false

	const bookingUid = String(booking?.uid || "").trim()
	if (bookingUid && bookingUid === currentUid) return true

	const currentEmail = getCurrentUserEmailForOwnership()
	const bookingEmail = String(booking?.email || "")
		.trim()
		.toLowerCase()

	return Boolean(currentEmail && bookingEmail && bookingEmail === currentEmail)
}

function stopDashboardRescheduleAvailabilityListener() {
	if (typeof dashboardRescheduleAvailabilityUnsubscribe === "function") {
		dashboardRescheduleAvailabilityUnsubscribe()
		dashboardRescheduleAvailabilityUnsubscribe = null
	}
}

function setDashboardRescheduleMessage(type = "", text = "") {
	const msg = authUi.dashboardRescheduleMessage
	if (!msg) return
	if (!type || !text) {
		clearFormMessage(msg)
		return
	}
	showFormMessage(msg, type, text)
}

function closeDashboardRescheduleModal() {
	stopDashboardRescheduleAvailabilityListener()
	dashboardRescheduleTarget = null
	setDashboardRescheduleMessage("", "")
	if (authUi.dashboardRescheduleModal) {
		authUi.dashboardRescheduleModal.classList.remove("active")
		authUi.dashboardRescheduleModal.setAttribute("aria-hidden", "true")
	}
	document.body.style.overflow = ""
}

function renderDashboardBookingRows(bookings = []) {
	if (!authUi.dashboardBookingsList) return
	if (!Array.isArray(bookings) || !bookings.length) {
		authUi.dashboardBookingsList.innerHTML = "<li>No appointments yet.</li>"
		return
	}

	const bookingsWithQueuePositions = enrichDashboardWaitlistPositions(bookings)

	authUi.dashboardBookingsList.innerHTML = bookingsWithQueuePositions
		.map((booking) => {
			const status = normalizeBookingStatus(booking.status)
			const isWaitlisted = status === "waitlisted"
			const active = isBookingActionable(booking)
			const disabledAttr = active ? "" : "disabled"
			const id = escapeHtml(booking.id || "")
			const stylistLabel = escapeHtml(
				getStylistDisplayName(booking.stylistKey || booking.stylist),
			)
			const waitlistSummary = isWaitlisted
				? getDashboardWaitlistSummary(booking)
				: ""
			const waitlistQueueChip = isWaitlisted
				? renderDashboardWaitlistQueueChip(booking)
				: ""
			return `
	      <li class="dashboard-booking-row ${isWaitlisted ? "dashboard-booking-row--waitlisted" : ""}">
	        <strong>${escapeHtml(booking.service || "Service")}</strong>
	        <span>${escapeHtml(booking.date || "No date")} at ${escapeHtml(booking.time || "No time")}</span>
	        <span>Stylist: ${stylistLabel}</span>
	        <span class="dashboard-booking-status-line"><span>Status: ${escapeHtml(status)}</span>${waitlistQueueChip}</span>
        ${
					waitlistSummary
						? `<span class="dashboard-waitlist-place-text">Waitlist Place: ${escapeHtml(waitlistSummary)}</span>`
						: ""
				}
        ${
					active
						? `<div class="admin-booking-actions" style="margin-top:10px">
            <button type="button" class="admin-action-btn" data-dashboard-booking-action="reschedule" data-booking-id="${id}" ${disabledAttr}>Reschedule</button>
            <button type="button" class="admin-action-btn danger" data-dashboard-booking-action="cancel" data-booking-id="${id}" ${disabledAttr}>Cancel</button>
          </div>`
						: ""
				}
      </li>
    `
		})
		.join("")
}

function subscribeToDashboardRescheduleAvailability(
	dateValue,
	stylistKey,
	currentSlotId,
) {
	if (!appServicesReady || !db || !dateValue || !authUi.dashboardRescheduleTime)
		return

	stopDashboardRescheduleAvailabilityListener()

	const normalizedStylist =
		String(stylistKey || "")
			.trim()
			.toLowerCase() || "any"
	const datePrefix = `${dateValue}__`
	const datePrefixEnd = `${dateValue}__\uf8ff`

	dashboardRescheduleAvailabilityUnsubscribe = db
		.collection("bookingSlots")
		.where(getDocumentIdField(), ">=", datePrefix)
		.where(getDocumentIdField(), "<=", datePrefixEnd)
		.onSnapshot(
			(snapshot) => {
				const taken = new Set()
				snapshot.forEach((doc) => {
					if (currentSlotId && doc.id === currentSlotId) return
					const data = doc.data() || {}
					const docStylist = normalizeStylistKey(
						data.stylistKey || data.stylist || "any",
					)
					const blocksSelectedStylist =
						normalizedStylist === "any"
							? true
							: docStylist === normalizedStylist || docStylist === "any"
					if (blocksSelectedStylist && data.taken && data.time) {
						taken.add(String(data.time))
					}
				})

				authUi.dashboardRescheduleTime.innerHTML =
					'<option value="">Select Time</option>'
				timeSlots.forEach((slot) => {
					if (taken.has(slot)) return
					const opt = document.createElement("option")
					opt.value = slot
					opt.textContent = slot
					authUi.dashboardRescheduleTime.appendChild(opt)
				})

				const previousSelection = String(
					authUi.dashboardRescheduleTime.value || "",
				).trim()
				if (previousSelection) {
					const hasPreviousSelection = Array.from(
						authUi.dashboardRescheduleTime.options,
					).some((option) => option.value === previousSelection)
					if (hasPreviousSelection) {
						authUi.dashboardRescheduleTime.value = previousSelection
					}
				}

				if (authUi.dashboardRescheduleTime.options.length <= 1) {
					setDashboardRescheduleMessage(
						"error",
						"No available time slots for this date/stylist. Please choose another date or stylist.",
					)
				} else {
					setDashboardRescheduleMessage("", "")
					if (
						dashboardRescheduleTarget?.time &&
						String(dashboardRescheduleTarget.date || "") ===
							String(dateValue || "")
					) {
						const currentTime = String(dashboardRescheduleTarget.time || "")
						if (!authUi.dashboardRescheduleTime.value && currentTime) {
							setDashboardRescheduleMessage(
								"error",
								"Please select a new time to continue rescheduling.",
							)
						}
					}
				}
			},
			(error) => {
				console.error("Dashboard reschedule availability failed:", error)
				setDashboardRescheduleMessage(
					"error",
					"Could not load times right now. Please try again.",
				)
			},
		)
}

function openDashboardRescheduleModal(booking) {
	if (!booking || !authUi.dashboardRescheduleModal) return
	if (!isBookingActionable(booking)) {
		showTimedDashboardFavoritesMessage(
			"error",
			"❌ This booking can no longer be rescheduled.",
		)
		return
	}
	dashboardRescheduleTarget = { ...booking }
	setDashboardRescheduleMessage("", "")

	const minDate = new Date().toISOString().split("T")[0]
	const bookingDate = String(booking.date || "").trim()
	const initialDate =
		bookingDate && bookingDate >= minDate ? bookingDate : minDate
	if (authUi.dashboardRescheduleDate) {
		authUi.dashboardRescheduleDate.min = minDate
		authUi.dashboardRescheduleDate.value = initialDate
	}

	const stylistKey = normalizeStylistKey(booking.stylistKey || booking.stylist)
	if (authUi.dashboardRescheduleStylist) {
		authUi.dashboardRescheduleStylist.value = stylistKey
		authUi.dashboardRescheduleStylist.disabled = false
	}

	if (authUi.dashboardRescheduleTime) {
		authUi.dashboardRescheduleTime.innerHTML =
			'<option value="">Select Time</option>'
		authUi.dashboardRescheduleTime.value = ""
	}

	subscribeToDashboardRescheduleAvailability(
		initialDate,
		stylistKey,
		String(booking.slotId || ""),
	)

	authUi.dashboardRescheduleModal.classList.add("active")
	authUi.dashboardRescheduleModal.setAttribute("aria-hidden", "false")
	document.body.style.overflow = "hidden"
}

async function cancelDashboardBooking(bookingId) {
	if (!appServicesReady || !auth?.currentUser || !bookingId) return
	await callClientCancelBookingAction(bookingId)
}

async function saveDashboardRescheduleChanges() {
	if (
		!appServicesReady ||
		!db ||
		!auth?.currentUser ||
		!dashboardRescheduleTarget
	)
		return

	const bookingId = String(dashboardRescheduleTarget.id || "")
	if (!bookingId) return

	const nextDate = String(authUi.dashboardRescheduleDate?.value || "").trim()
	const nextTime = String(authUi.dashboardRescheduleTime?.value || "").trim()
	const nextStylistKey = normalizeStylistKey(
		authUi.dashboardRescheduleStylist?.value ||
			dashboardRescheduleTarget.stylistKey ||
			dashboardRescheduleTarget.stylist,
	)

	if (!nextDate || !nextTime) {
		setDashboardRescheduleMessage("error", "Select both date and time.")
		return
	}

	const nextSlotId = getSlotId(nextDate, nextStylistKey, nextTime)
	const currentSlotId = String(dashboardRescheduleTarget.slotId || "")
	if (nextSlotId === currentSlotId) {
		setDashboardRescheduleMessage(
			"error",
			"Please choose a different time from your current booking.",
		)
		return
	}

	const saveBtn = authUi.dashboardRescheduleSaveBtn
	if (saveBtn) {
		setButtonLoadingState(saveBtn, true, {
			loadingText: "Saving...",
		})
	}

	try {
		await callClientRescheduleBookingAction({
			bookingId,
			date: nextDate,
			time: nextTime,
			stylistKey: nextStylistKey,
		})

		closeDashboardRescheduleModal()
		await loadUserDashboardData(auth.currentUser)
		showTimedDashboardFavoritesMessage(
			"success",
			"✅ Booking rescheduled successfully.",
		)
	} catch (error) {
		console.error("Reschedule failed:", error)
		setDashboardRescheduleMessage(
			"error",
			`❌ ${error?.message || "Could not reschedule right now."}`,
		)
	} finally {
		if (saveBtn) {
			setButtonLoadingState(saveBtn, false, {
				resetText: "Save Changes",
			})
		}
	}
}

function getGalleryIdentity(style = {}) {
	return String(style.id || style.styleName || style.styleType || "")
		.trim()
		.toLowerCase()
}

function isStyleFavorited(style = {}) {
	const identity = getGalleryIdentity(style)
	if (!identity) return false
	return dashboardFavoriteStyles.some(
		(item) => getGalleryIdentity(item) === identity,
	)
}

function setFavoriteButtonState(button, favorited) {
	if (!button) return
	const active = favorited === true
	button.classList.toggle("is-favorited", active)
	button.textContent = active ? "♥ Saved" : "♡ Save"
	button.setAttribute("aria-pressed", active ? "true" : "false")
}

function updateFavoriteButtonsUI() {
	document.querySelectorAll(".gallery-save-favorite-btn").forEach((btn) => {
		const styleId = btn.dataset.favStyleId || ""
		const style = galleryData.find(
			(item) => String(item.id || "") === String(styleId),
		)
		setFavoriteButtonState(btn, isStyleFavorited(style))
	})

	const lightboxFavoriteBtn = document.getElementById("lightboxFavoriteBtn")
	if (lightboxFavoriteBtn) {
		const visible = getVisibleGalleryData()
		const safeIndex =
			((currentLightboxIndex % Math.max(visible.length, 1)) +
				Math.max(visible.length, 1)) %
			Math.max(visible.length, 1)
		const activeStyle = visible[safeIndex]
		setFavoriteButtonState(lightboxFavoriteBtn, isStyleFavorited(activeStyle))
	}
}

function renderDashboardFavorites(mount, styles = [], emptyText) {
	if (authUi.dashboardFavoritesCount) {
		authUi.dashboardFavoritesCount.textContent = String(styles.length || 0)
	}

	if (!mount) return
	if (!Array.isArray(styles) || !styles.length) {
		mount.innerHTML = `<li>${emptyText}</li>`
		return
	}

	mount.innerHTML = styles
		.map((style) => {
			const styleId = escapeHtml(String(style.id || ""))
			const styleName = escapeHtml(style.styleName || "Favorite style")
			const styleMeta = escapeHtml(
				`${style.styleType || "Braids"} • ${style.stylistName || "Royal Braids Team"}`,
			)
			const imageUrl = escapeHtml(style.imageUrl || "")
			return `
      <li class="dashboard-favorite-card">
        <div class="dashboard-favorite-item">
        <div class="dashboard-favorite-media">
          ${
						imageUrl
							? `<img src="${imageUrl}" alt="${styleName}" loading="lazy" decoding="async" fetchpriority="low" />`
							: "<span>Style</span>"
					}
        </div>
        <div class="dashboard-favorite-content">
          <strong>${styleName}</strong>
          <p>${styleMeta}</p>
          <div class="dashboard-favorite-actions">
            <button type="button" class="btn btn-outline" data-dashboard-favorite-book="${styleId}">Book</button>
            <button type="button" class="btn btn-outline" data-dashboard-favorite-remove="${styleId}">Remove</button>
          </div>
        </div>
        </div>
      </li>
    `
		})
		.join("")
}

function stopDashboardFavoritesListener() {
	if (typeof dashboardFavoritesUnsubscribe === "function") {
		dashboardFavoritesUnsubscribe()
		dashboardFavoritesUnsubscribe = null
	}
}

function stopDashboardBookingsListener() {
	if (typeof dashboardBookingsUnsubscribe === "function") {
		dashboardBookingsUnsubscribe()
		dashboardBookingsUnsubscribe = null
	}
	activeDashboardBookingsKey = ""
	dashboardBookingsRenderToken += 1
}

function startDashboardBookingsListener(uid, email = "") {
	const safeUid = String(uid || "").trim()
	const safeEmail = String(email || "")
		.trim()
		.toLowerCase()
	if (!appServicesReady || !db || !safeUid) return

	const listenerKey = `${safeUid}|${safeEmail}`
	if (
		activeDashboardBookingsKey === listenerKey &&
		typeof dashboardBookingsUnsubscribe === "function"
	) {
		return
	}

	stopDashboardBookingsListener()
	activeDashboardBookingsKey = listenerKey

	let uidDocs = []
	let emailDocs = []
	const unsubscribers = []

	const renderSnapshotDocs = async () => {
		const renderToken = ++dashboardBookingsRenderToken
		const bookingDocMap = new Map()
		;[...uidDocs, ...emailDocs].forEach((item) => {
			const id = String(item?.id || "").trim()
			if (id) bookingDocMap.set(id, item)
		})

		const sortedDocs = [...bookingDocMap.values()].sort((a, b) => {
			const updatedDiff =
				toTimestampMs(b.updatedAt) - toTimestampMs(a.updatedAt)
			if (updatedDiff !== 0) return updatedDiff
			return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt)
		})

		let latestPhone = ""
		const nextBookings = sortedDocs.slice(0, 5).map((item) => {
			if (!latestPhone && item.phone) latestPhone = item.phone
			return { ...item }
		})

		try {
			const hydratedBookings =
				await hydrateDashboardWaitlistQueueInfo(nextBookings)
			if (renderToken !== dashboardBookingsRenderToken) return
			dashboardBookingDocs = hydratedBookings
			renderDashboardBookingRows(dashboardBookingDocs)
		} catch (error) {
			console.warn("Dashboard realtime bookings hydration failed:", error)
			if (renderToken !== dashboardBookingsRenderToken) return
			dashboardBookingDocs = nextBookings
			renderDashboardBookingRows(dashboardBookingDocs)
		}

		if (latestPhone && authUi.dashboardProfilePhone) {
			authUi.dashboardProfilePhone.textContent = latestPhone
		}
	}

	const attachBookingsListener = (query, source) =>
		query.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) => ({
					id: doc.id,
					...(doc.data() || {}),
				}))
				if (source === "uid") uidDocs = docs
				else emailDocs = docs
				void renderSnapshotDocs()
			},
			(error) => {
				console.warn(
					"Dashboard " + source + " bookings realtime listener failed:",
					error,
				)
			},
		)

	unsubscribers.push(
		attachBookingsListener(
			db.collection("bookings").where("uid", "==", safeUid).limit(20),
			"uid",
		),
	)

	if (safeEmail) {
		unsubscribers.push(
			attachBookingsListener(
				db.collection("bookings").where("email", "==", safeEmail).limit(20),
				"email",
			),
		)
	}

	dashboardBookingsUnsubscribe = () => {
		unsubscribers.forEach((unsubscribe) => {
			if (typeof unsubscribe !== "function") return
			try {
				unsubscribe()
			} catch (_error) {
				// no-op: listener may already be closed
			}
		})
	}
}

function getFavoritePayload(style = {}) {
	return {
		id: String(style.id || "").trim(),
		styleName: String(style.styleName || "").trim(),
		styleType: String(style.styleType || "").trim(),
		stylistName: String(style.stylistName || "").trim(),
		imageUrl: String(style.imageUrl || "").trim(),
		savedAt: getServerTimestamp(),
	}
}

function getFavoriteLoginPrompt(style = {}) {
	const directLabel = String(style.serviceLabel || "").trim()
	const categoryLabel = String(
		style.serviceCategory ? getGalleryServiceLabel(style.serviceCategory) : "",
	).trim()
	const label = directLabel || categoryLabel || "gallery"
	const categoryText = label
		.replace(/\s+services$/i, "")
		.trim()
		.toLowerCase()
		.replace(/s$/, "")

	return `🔐 Log in to save this ${categoryText || "gallery"} style.`
}

async function toggleFavoriteStyle(style = {}, sourceButton = null) {
	if (!appServicesReady || !db || !auth) return

	const user = auth.currentUser
	if (!user || user.isAnonymous) {
		shouldAutoFocusDashboardAfterAuth = true
		openAuthModal("signin")
		if (authUi.message) {
			showTimedAuthMessage("error", getFavoriteLoginPrompt(style))
		}
		return
	}

	const styleId = String(style.id || "").trim()
	if (!styleId) return

	if (sourceButton) {
		setButtonLoadingState(sourceButton, true, {
			loadingText: "Saving...",
		})
	}
	const favoriteRef = db
		.collection("users")
		.doc(user.uid)
		.collection("favorites")
		.doc(styleId)

	try {
		if (isStyleFavorited(style)) {
			await favoriteRef.delete()
			showFavoritesToast("Removed from favorites")
			showTimedDashboardFavoritesMessage(
				"success",
				"🗑️ Style removed from favorites.",
			)
		} else {
			await favoriteRef.set(getFavoritePayload(style), { merge: true })
			showFavoritesToast("Saved to favorites")
			showTimedDashboardFavoritesMessage(
				"success",
				"💖 Style saved to favorites.",
			)
		}
	} catch (error) {
		console.error("Favorite toggle failed:", error)
		showTimedDashboardFavoritesMessage(
			"error",
			"⚠️ Could not update favorites right now.",
		)
	} finally {
		if (sourceButton) {
			setButtonLoadingState(sourceButton, false)
		}
	}
}

function startDashboardFavoritesListener(uid) {
	if (!appServicesReady || !db || !uid) return

	if (
		activeDashboardUid === uid &&
		typeof dashboardFavoritesUnsubscribe === "function"
	) {
		return
	}

	stopDashboardFavoritesListener()
	activeDashboardUid = uid

	dashboardFavoritesUnsubscribe = db
		.collection("users")
		.doc(uid)
		.collection("favorites")
		.limit(30)
		.onSnapshot(
			(snapshot) => {
				dashboardFavoriteStyles = snapshot.docs
					.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
					.sort(
						(a, b) =>
							toTimestampMs(b.savedAt || b.updatedAt) -
							toTimestampMs(a.savedAt || a.updatedAt),
					)

				renderDashboardFavorites(
					authUi.dashboardFavoritesList,
					dashboardFavoriteStyles,
					"No favorite styles yet. Tap ♡ Save in gallery.",
				)
				updateFavoriteButtonsUI()
			},
			(error) => {
				console.error("Favorites listener failed:", error)
				renderDashboardFavorites(
					authUi.dashboardFavoritesList,
					[],
					"Could not load favorite styles right now.",
				)
			},
		)
}

async function loadUserDashboardData(userOrUid) {
	const uid =
		typeof userOrUid === "string"
			? userOrUid
			: userOrUid?.uid || auth?.currentUser?.uid || ""
	const email =
		typeof userOrUid === "string"
			? String(auth?.currentUser?.email || "")
			: String(userOrUid?.email || auth?.currentUser?.email || "")
					.trim()
					.toLowerCase()

	if (!appServicesReady || !db || !uid) return
	startDashboardFavoritesListener(uid)
	startDashboardBookingsListener(uid, email)

	try {
		const getDashboardCollectionSnapshot = async ({
			name = "",
			indexedQuery,
			fallbackQuery,
		} = {}) => {
			try {
				return await indexedQuery.get()
			} catch (indexedQueryError) {
				console.warn(
					`Indexed ${name} query failed, falling back to non-indexed fetch:`,
					indexedQueryError,
				)
				try {
					return await fallbackQuery.get()
				} catch (fallbackQueryError) {
					console.warn(`Fallback ${name} query failed:`, fallbackQueryError)
					return null
				}
			}
		}

		const [bookingsByUidSnap, reviewsSnap, loginHistorySnap] =
			await Promise.all([
				getDashboardCollectionSnapshot({
					name: "bookings",
					indexedQuery: db
						.collection("bookings")
						.where("uid", "==", uid)
						.orderBy("createdAt", "desc")
						.limit(5),
					fallbackQuery: db.collection("bookings").where("uid", "==", uid),
				}),
				getDashboardCollectionSnapshot({
					name: "reviews",
					indexedQuery: db
						.collection("reviews")
						.where("uid", "==", uid)
						.orderBy("createdAt", "desc")
						.limit(5),
					fallbackQuery: db.collection("reviews").where("uid", "==", uid),
				}),
				getDashboardCollectionSnapshot({
					name: "login history",
					indexedQuery: db
						.collection("loginActivities")
						.where("uid", "==", uid)
						.orderBy("createdAt", "desc")
						.limit(12),
					fallbackQuery: db
						.collection("loginActivities")
						.where("uid", "==", uid),
				}),
			])

		let bookingsByEmailSnap = null

		if (email) {
			try {
				bookingsByEmailSnap = await db
					.collection("bookings")
					.where("email", "==", email)
					.limit(20)
					.get()
			} catch (emailQueryError) {
				console.warn("Email-linked bookings query failed:", emailQueryError)
			}
		}

		dashboardBookingDocs = []
		let latestPhone = ""
		const bookingDocMap = new Map()
		;(bookingsByUidSnap?.docs || []).forEach((doc) => {
			bookingDocMap.set(doc.id, doc)
		})
		;(bookingsByEmailSnap?.docs || []).forEach((doc) => {
			if (!bookingDocMap.has(doc.id)) {
				bookingDocMap.set(doc.id, doc)
			}
		})

		const bookingsDocs = [...bookingDocMap.values()].sort(
			(a, b) =>
				toTimestampMs(b.data()?.createdAt) - toTimestampMs(a.data()?.createdAt),
		)
		bookingsDocs.slice(0, 5).forEach((doc) => {
			const data = doc.data() || {}
			if (!latestPhone && data.phone) latestPhone = data.phone
			dashboardBookingDocs.push({ id: doc.id, ...data })
		})
		dashboardBookingDocs =
			await hydrateDashboardWaitlistQueueInfo(dashboardBookingDocs)

		const reviewItems = []
		const reviewDocs = [...(reviewsSnap?.docs || [])].sort(
			(a, b) =>
				toTimestampMs(b.data()?.createdAt) - toTimestampMs(a.data()?.createdAt),
		)
		reviewDocs.slice(0, 5).forEach((doc) => {
			const data = doc.data() || {}
			const safeRating = Math.max(0, Math.min(5, Number(data.rating || 0)))
			reviewItems.push(
				`${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)} • ${escapeHtml(data.status || "pending")} • ${escapeHtml((data.text || "").slice(0, 80))}${(data.text || "").length > 80 ? "..." : ""}`,
			)
		})

		renderDashboardBookingRows(dashboardBookingDocs)
		renderDashboardList(
			authUi.dashboardReviewsList,
			reviewItems,
			"No reviews submitted yet.",
		)

		const loginHistoryItems = [...(loginHistorySnap?.docs || [])]
			.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }))
			.sort((a, b) => toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt))
			.slice(0, 12)
		if (typeof trackLoginActivity === "function") {
			const userForSession =
				typeof userOrUid === "string"
					? auth?.currentUser
					: userOrUid || auth?.currentUser
			const hasCurrentSessionEntry = loginHistoryItems.some((item = {}) => {
				const status = String(item.status || "")
					.trim()
					.toLowerCase()
				if (status !== "success") return false
				const method = String(item.method || "")
					.trim()
					.toLowerCase()
				const likelySessionMethod =
					method === "google" || method === "email/password"
				const itemMs = toTimestampMs(item.createdAt)
				return likelySessionMethod && itemMs && Date.now() - itemMs <= 90 * 1000
			})

			if (
				!hasCurrentSessionEntry &&
				userForSession &&
				!userForSession.isAnonymous
			) {
				void trackLoginActivity({
					method:
						String(userForSession.providerData?.[0]?.providerId || "") ===
						"google.com"
							? "google"
							: "email/password",
					status: "success",
					context: { source: "dashboard-load" },
				})
			}
		}
		renderDashboardLoginHistory(loginHistoryItems)

		if (latestPhone && authUi.dashboardProfilePhone) {
			authUi.dashboardProfilePhone.textContent = latestPhone
		}

		const hasBookingsAccessIssue = !bookingsByUidSnap
		const hasReviewsAccessIssue = !reviewsSnap
		const hasLoginHistoryAccessIssue = !loginHistorySnap
		const hasCoreDashboardSectionIssue =
			hasBookingsAccessIssue || hasReviewsAccessIssue

		if (hasLoginHistoryAccessIssue) {
			console.warn(
				"Dashboard login history could not be loaded. Keeping appointments/reviews visible.",
			)
		}

		if (authUi.dashboardMessage) {
			if (hasCoreDashboardSectionIssue) {
				showFormMessage(
					authUi.dashboardMessage,
					"error",
					"⚠️ Some dashboard sections could not load. Your available data is shown below.",
				)
			} else {
				clearFormMessage(authUi.dashboardMessage)
			}
		}
	} catch (error) {
		console.error("Dashboard data load failed:", error)
		if (authUi.dashboardMessage) {
			showFormMessage(
				authUi.dashboardMessage,
				"error",
				"⚠️ Could not load dashboard data right now.",
			)
		}
	}
}

async function handleGoogleAuth() {
	if (!appServicesReady || !auth) return
	if (authUi.message) clearFormMessage(authUi.message)
	if (googleAuthInProgress) {
		if (authUi.message) {
			showTimedAuthMessage(
				"error",
				"⏳ Google sign-in is already in progress. Please wait...",
			)
		}
		return
	}

	googleAuthInProgress = true
	setGoogleAuthButtonsBusy(true)
	setAuthSwitchingState(true)

	try {
		const provider = createGoogleProvider()
		provider.setCustomParameters({
			prompt: "select_account",
		})

		if (shouldPreferRedirectGoogleAuth()) {
			if (authUi.message) {
				showTimedAuthMessage("success", "🔄 Opening secure Google sign-in...")
			}
			if (auth.currentUser?.isAnonymous) {
				await auth.currentUser.linkWithRedirect(provider)
			} else {
				await auth.signInWithRedirect(provider)
			}
			return
		}

		let popupResult = null
		if (auth.currentUser?.isAnonymous) {
			try {
				popupResult = await auth.currentUser.linkWithPopup(provider)
			} catch (linkError) {
				const linkCode = linkError?.code || ""
				const canFallbackToSignin =
					linkCode === "auth/credential-already-in-use" ||
					linkCode === "auth/email-already-in-use" ||
					linkCode === "auth/account-exists-with-different-credential"

				if (!canFallbackToSignin) {
					throw linkError
				}

				popupResult = await auth.signInWithPopup(provider)
			}
		} else {
			popupResult = await auth.signInWithPopup(provider)
		}

		const signedInUser = popupResult?.user || auth.currentUser
		await finalizeGoogleSignInResult(signedInUser, { source: "popup" })
	} catch (error) {
		console.error("Google auth failed:", error)
		shouldAutoFocusDashboardAfterAuth = false
		void trackLoginActivity({
			method: "google",
			status: "failure",
			error,
			context: { source: "google-auth" },
		})
		const code = error?.code || ""

		const useRedirectFallback =
			code === "auth/invalid-action-code" ||
			code === "auth/operation-not-supported-in-this-environment" ||
			code === "auth/popup-blocked"

		if (useRedirectFallback) {
			try {
				if (authUi.message) {
					showTimedAuthMessage(
						"success",
						"🔄 Popup failed, redirecting to Google sign-in...",
					)
				}
				const provider = createGoogleProvider()
				provider.setCustomParameters({ prompt: "select_account" })
				if (auth.currentUser?.isAnonymous) {
					await auth.currentUser.linkWithRedirect(provider)
				} else {
					await auth.signInWithRedirect(provider)
				}
				return
			} catch (redirectError) {
				console.error("Google redirect fallback failed:", redirectError)
				if (authUi.message) {
					showTimedAuthMessage(
						"error",
						`❌ ${getFriendlyAuthError(redirectError)}`,
					)
				}
			}
		}

		if (authUi.message) {
			showTimedAuthMessage("error", `❌ ${getFriendlyAuthError(error)}`)
		}
	} finally {
		googleAuthInProgress = false
		setGoogleAuthButtonsBusy(false)
		setAuthSwitchingState(false)
	}
}

async function handleEmailAuthSubmit(event) {
	event.preventDefault()
	if (!appServicesReady || !auth) return
	if (authUi.message) clearFormMessage(authUi.message)

	const email = authUi.emailInput?.value?.trim() || ""
	const password = authUi.passwordInput?.value || ""
	const name = authUi.nameInput?.value?.trim() || ""

	if (!email || !password) {
		if (authUi.message) {
			showTimedAuthMessage("error", "❌ Email and password are required.")
		}
		return
	}

	if (authMode === "signup" && name.length < 2) {
		if (authUi.message) {
			showTimedAuthMessage("error", "❌ Please enter your full name.")
		}
		return
	}

	if (authUi.submitBtn) {
		setButtonLoadingState(authUi.submitBtn, true, {
			loadingText:
				authMode === "signup" ? "Creating Account..." : "Signing In...",
		})
	}
	setAuthSwitchingState(true)

	try {
		const currentUser = auth.currentUser
		const credential = createEmailCredential(email, password)
		let signedInUser = null

		if (authMode === "signin") {
			const precheck = await checkTemporaryBlockBeforeEmailSignIn(email)
			if (precheck.blocked) {
				const untilLabel = formatRestrictionUntilLabel(precheck.blockedUntilMs)
				showTimedAuthMessage(
					"error",
					`⛔ This account is temporarily blocked${untilLabel ? ` until ${untilLabel}` : ""}.`,
				)
				return
			}
		}

		if (authMode === "signup") {
			if (currentUser?.isAnonymous) {
				const linked = await currentUser.linkWithCredential(credential)
				signedInUser = linked?.user || currentUser
			} else {
				const created = await auth.createUserWithEmailAndPassword(
					email,
					password,
				)
				signedInUser = created?.user || auth.currentUser
			}

			if (name && signedInUser) {
				await signedInUser.updateProfile({ displayName: name })
				signedInUser = {
					...signedInUser,
					displayName: name,
				}
			}
		} else {
			const signedIn = await auth.signInWithEmailAndPassword(email, password)
			signedInUser = signedIn?.user || auth.currentUser
		}

		signedInUser = signedInUser || auth.currentUser
		if (signedInUser && !signedInUser.isAnonymous) {
			const allowed = await enforceSignedInUserSecurityRestrictions(
				signedInUser,
				{ source: authMode === "signup" ? "email-signup" : "email-signin" },
			)
			if (!allowed) return

			setDashboardSignedInState(signedInUser)
			closeAuthModal()
			const loggedInName = getUserDisplayName(signedInUser)
			showFavoritesToast(`You're now Logged In as ${loggedInName}`)
			focusDashboardAfterAuthIfRequested()
		}

		await upsertUserProfile(signedInUser, {
			displayName: name,
			provider: "password",
		})
		if (signedInUser?.uid) {
			await loadUserDashboardData(signedInUser)
		}

		void trackLoginActivity({
			method: "email/password",
			status: "success",
			context: { source: authMode },
		})

		if (authUi.emailForm) authUi.emailForm.reset()
	} catch (error) {
		const code = error?.code || ""
		const isExpectedSignInCredentialFailure =
			authMode === "signin" &&
			(isSupabaseInvalidCredentialsError(error) ||
				code === "auth/wrong-password" ||
				code === "auth/invalid-credential")

		if (isExpectedSignInCredentialFailure) {
			console.warn("Email auth rejected credentials:", error)
		} else {
			console.error("Email auth failed:", error)
		}

		if (authMode === "signin") {
			void trackLoginActivity({
				method: "email/password",
				status: "failure",
				error,
				context: { source: "signin", attemptedEmail: email },
			})
		}

		if (authMode === "signin" && isSupabaseInvalidCredentialsError(error)) {
			showTimedAuthMessage("error", `❌ ${getFriendlyAuthError(error)}`)
			promptRegisterForMissingAccount()
			return
		}

		if (authMode === "signin" && code === "auth/wrong-password") {
			showTimedAuthMessage(
				"error",
				"❌ Incorrect password. This account exists — please enter the correct password and try again.",
			)
			return
		}

		if (authMode === "signin" && code === "auth/invalid-credential") {
			try {
				const methods = await auth.fetchSignInMethodsForEmail(email)

				if (!Array.isArray(methods) || methods.length === 0) {
					showTimedAuthMessage(
						"error",
						"❌ This account is not available. Please create an account and log in again.",
					)
					promptRegisterForMissingAccount()
					return
				}

				if (methods.includes("password")) {
					showTimedAuthMessage(
						"error",
						"❌ Incorrect password. This account exists — please enter the correct password and try again.",
					)
					return
				}

				showTimedAuthMessage(
					"error",
					"⚠️ This account exists but is not set up for password login. Please use the original sign-in method used during registration.",
				)
				return
			} catch (_lookupError) {
				showTimedAuthMessage(
					"error",
					"❌ This account is not available. Please create an account and log in again.",
				)
				promptRegisterForMissingAccount()
				return
			}
		}

		if (authMode === "signin" && code === "auth/user-not-found") {
			showTimedAuthMessage(
				"error",
				"❌ This account is not available. Please create an account and log in again.",
			)
			promptRegisterForMissingAccount()
			return
		}

		if (authMode === "signup" && code === "auth/email-already-in-use") {
			setAuthMode("signin")
			if (authUi.message) {
				showTimedAuthMessage(
					"error",
					"⚠️ This email is already registered. Please log in with your password.",
				)
			}
			return
		}

		if (authUi.message) {
			showTimedAuthMessage("error", `❌ ${getFriendlyAuthError(error)}`)
		}
	} finally {
		setAuthSwitchingState(false)
		if (authUi.submitBtn) {
			setButtonLoadingState(authUi.submitBtn, false, {
				resetText: authMode === "signup" ? "Create Account" : "Log In",
			})
		}
	}
}

async function handleForgotPassword() {
	if (!appServicesReady || !auth) return
	const forgotBtn = authUi.forgotPasswordBtn
	const email = authUi.emailInput?.value?.trim() || ""
	if (!email) {
		if (authUi.message) {
			showTimedAuthMessage(
				"error",
				"❌ Enter your email first, then click Forgot Password.",
			)
		}
		return
	}

	if (forgotBtn) {
		setButtonLoadingState(forgotBtn, true, {
			loadingText: "Sending...",
		})
	}

	try {
		await auth.sendPasswordResetEmail(email)
		if (authUi.message) {
			showTimedAuthMessage(
				"success",
				"✅ Password reset email sent. Please check your inbox.",
			)
		}
	} catch (error) {
		if (authUi.message) {
			showTimedAuthMessage("error", `❌ ${getFriendlyAuthError(error)}`)
		}
	} finally {
		if (forgotBtn) {
			setButtonLoadingState(forgotBtn, false, {
				resetText: "Forgot Password",
			})
		}
	}
}

async function handleLogout() {
	if (!appServicesReady || !auth) return
	const logoutBtn = authUi.logoutBtn
	if (logoutBtn) {
		setButtonLoadingState(logoutBtn, true, {
			loadingText: "Logging out...",
		})
	}
	try {
		await markCurrentSessionOffline()
		stopSessionHeartbeat()
		currentSessionId = ""
		await auth.signOut()
		closeAuthModal()
		setDashboardPromptState()
		showFavoritesToast("You're now continuing as guest")
	} catch (error) {
		console.error("Logout failed:", error)
	} finally {
		if (logoutBtn) {
			setButtonLoadingState(logoutBtn, false, {
				resetText: "Log Out",
			})
		}
	}
}

async function handleContinueAsGuest() {
	const guestBtn = authUi.continueAsGuestBtn
	if (guestBtn) {
		setButtonLoadingState(guestBtn, true, {
			loadingText: "Continuing...",
		})
	}

	try {
		if (appServicesReady && auth) {
			const currentUser = auth.currentUser
			if (currentUser && !currentUser.isAnonymous) {
				await auth.signOut()
			}

			if (!auth.currentUser) {
				await auth.signInAnonymously()
			}
		}

		setDashboardPromptState()
		closeAuthModal()
		showFavoritesToast("You're now continuing as guest")
		void trackLoginActivity({
			method: "anonymous",
			status: "success",
			context: { source: "continue-as-guest" },
		})
		document.getElementById("home")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		})
	} catch (error) {
		console.error("Continue as guest failed:", error)
		void trackLoginActivity({
			method: "anonymous",
			status: "failure",
			error,
			context: { source: "continue-as-guest" },
		})
		if (authUi.message) {
			showTimedAuthMessage("error", `❌ ${getFriendlyAuthError(error)}`)
		}
	} finally {
		if (guestBtn) {
			setButtonLoadingState(guestBtn, false, {
				resetText: "Continue as Guest",
			})
		}
	}
}

async function handleDeleteAccount() {
	if (!appServicesReady || !auth) return

	const user = auth.currentUser
	if (!user || user.isAnonymous) {
		if (authUi.dashboardMessage) {
			showTimedFormMessage(
				authUi.dashboardMessage,
				"error",
				"⚠️ Please log in first to delete your account.",
			)
		}
		return
	}

	const confirmed = await openDeleteAccountConfirmModal()
	if (!confirmed) return

	const deleteBtn =
		authUi.manageAccountDeleteBtn || authUi.dashboardDeleteAccountBtn
	if (deleteBtn) {
		setButtonLoadingState(deleteBtn, true, {
			loadingText: "Deleting...",
		})
	}

	try {
		await trackAccountSecurityChange({
			changeType: "account_deleted",
			details: "User requested account deletion",
			context: { source: "delete-account" },
		})
		await user.delete()

		if (!auth.currentUser) {
			await auth.signInAnonymously()
		}

		setDashboardPromptState()
		closeManageAccountModal()
		closeAuthModal()
		showAccountDeletedPopup()
		document.getElementById("home")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		})
	} catch (error) {
		console.error("Delete account failed:", error)
		if (authUi.dashboardMessage) {
			showTimedFormMessage(
				authUi.dashboardMessage,
				"error",
				`❌ ${getFriendlyAuthError(error)}`,
			)
		}
	} finally {
		if (deleteBtn) {
			setButtonLoadingState(deleteBtn, false, {
				resetText: "Delete Account",
			})
		}
	}
}

function bindAuthUiEvents() {
	if (authUi.openBtn) {
		authUi.openBtn.addEventListener("click", () => openAuthModal("signin"))
	}
	if (authUi.closeBtn) {
		authUi.closeBtn.addEventListener("click", closeAuthModal)
	}
	if (authUi.backdrop) {
		authUi.backdrop.addEventListener("click", closeAuthModal)
	}
	if (authUi.googleBtn) {
		authUi.googleBtn.addEventListener("click", () => {
			void handleGoogleAuth()
		})
	}
	if (authUi.emailForm) {
		authUi.emailForm.addEventListener("submit", (event) => {
			void handleEmailAuthSubmit(event)
		})
	}
	if (authUi.passwordToggleBtn && authUi.passwordInput) {
		authUi.passwordToggleBtn.addEventListener("click", () => {
			setAuthPasswordVisibility(authUi.passwordInput.type === "password")
		})
	}
	if (authUi.switchToSignupBtn) {
		authUi.switchToSignupBtn.addEventListener("click", () =>
			setAuthMode("signup"),
		)
	}
	if (authUi.switchToSigninBtn) {
		authUi.switchToSigninBtn.addEventListener("click", () =>
			setAuthMode("signin"),
		)
	}
	if (authUi.forgotPasswordBtn) {
		authUi.forgotPasswordBtn.addEventListener("click", () => {
			void handleForgotPassword()
		})
	}
	if (authUi.continueAsGuestBtn) {
		authUi.continueAsGuestBtn.addEventListener("click", () => {
			void handleContinueAsGuest()
		})
	}
	if (authUi.postBookingGoogleBtn) {
		authUi.postBookingGoogleBtn.addEventListener("click", () => {
			openAuthModal("signin")
			if (authUi.message) {
				showTimedAuthMessage(
					"success",
					"Log in using your email and password to sync this booking.",
				)
			}
		})
	}
	if (authUi.postBookingLaterBtn) {
		authUi.postBookingLaterBtn.addEventListener("click", () => {
			setPostBookingPromptVisible(false)
		})
	}
	if (authUi.reviewAuthHintBtn) {
		authUi.reviewAuthHintBtn.addEventListener("click", () => {
			openAuthModal("signin")
		})
	}
	if (authUi.reviewSubmitAuthGateBtn) {
		authUi.reviewSubmitAuthGateBtn.addEventListener("click", () => {
			openAuthModal("signin")
		})
	}
	if (authUi.logoutBtn) {
		authUi.logoutBtn.addEventListener("click", () => {
			void handleLogout()
		})
	}
	if (authUi.dashboardAuthBtn) {
		authUi.dashboardAuthBtn.addEventListener("click", () => {
			if (isNonGuestSignedIn()) {
				openManageAccountModal()
				return
			}
			openAuthModal("signin")
		})
	}
	if (authUi.manageAccountBackdrop) {
		authUi.manageAccountBackdrop.addEventListener(
			"click",
			closeManageAccountModal,
		)
	}
	if (authUi.manageAccountCloseBtn) {
		authUi.manageAccountCloseBtn.addEventListener(
			"click",
			closeManageAccountModal,
		)
	}
	if (authUi.manageAccountSaveProfileBtn) {
		authUi.manageAccountSaveProfileBtn.addEventListener("click", () => {
			void handleManageAccountSaveProfile()
		})
	}
	if (authUi.manageAccountEmail && authUi.manageAccountEmailHint) {
		authUi.manageAccountEmail.addEventListener("input", () => {
			updateManageHintState(
				authUi.manageAccountEmail,
				authUi.manageAccountEmailHint,
				isValidEmailFormat(authUi.manageAccountEmail.value),
				"✅ Email looks good.",
				"Use a valid email format (e.g. name@example.com).",
			)
		})
	}
	if (authUi.manageAccountPhone && authUi.manageAccountPhoneHint) {
		authUi.manageAccountPhone.addEventListener("input", () => {
			updateManageHintState(
				authUi.manageAccountPhone,
				authUi.manageAccountPhoneHint,
				isValidPhoneFormat(authUi.manageAccountPhone.value),
				"✅ Phone format looks good.",
				"Use digits with optional +, spaces, or dashes.",
			)
		})
	}
	if (authUi.manageAccountNewPassword) {
		authUi.manageAccountNewPassword.addEventListener("input", () => {
			updateManagePasswordStrengthUI(authUi.manageAccountNewPassword.value)
		})
		setManagePasswordVisibility(
			authUi.manageAccountCurrentPassword,
			authUi.manageAccountCurrentPasswordToggle,
			false,
			"current password",
		)
		setManagePasswordVisibility(
			authUi.manageAccountNewPassword,
			authUi.manageAccountNewPasswordToggle,
			false,
			"new password",
		)
	}
	if (authUi.manageAccountAvatarInput) {
		authUi.manageAccountAvatarInput.addEventListener("change", () => {
			const file = authUi.manageAccountAvatarInput?.files?.[0]
			if (!file || !authUi.manageAccountAvatarPreview) return
			if (file.size > 5 * 1024 * 1024) {
				showTimedFormMessage(
					authUi.manageAccountMessage,
					"error",
					"❌ Profile picture must be 5MB or less.",
				)
				authUi.manageAccountAvatarInput.value = ""
				setManageAvatarPreview(auth.currentUser)
				return
			}

			const reader = new FileReader()
			reader.onload = () => {
				const existingImg =
					authUi.manageAccountAvatarPreview.querySelector("img")
				if (existingImg) existingImg.remove()
				const previewImg = document.createElement("img")
				previewImg.src = String(reader.result || "")
				previewImg.alt = "Profile preview"
				authUi.manageAccountAvatarPreview.appendChild(previewImg)
				if (authUi.manageAccountAvatarInitial) {
					authUi.manageAccountAvatarInitial.style.display = "none"
				}
			}
			reader.readAsDataURL(file)
		})
	}
	if (authUi.manageAccountChangePasswordBtn) {
		authUi.manageAccountChangePasswordBtn.addEventListener("click", () => {
			void handleManageAccountChangePassword()
		})
	}
	if (
		authUi.manageAccountCurrentPasswordToggle &&
		authUi.manageAccountCurrentPassword
	) {
		authUi.manageAccountCurrentPasswordToggle.addEventListener("click", () => {
			setManagePasswordVisibility(
				authUi.manageAccountCurrentPassword,
				authUi.manageAccountCurrentPasswordToggle,
				authUi.manageAccountCurrentPassword.type === "password",
				"current password",
			)
		})
	}
	if (
		authUi.manageAccountNewPasswordToggle &&
		authUi.manageAccountNewPassword
	) {
		authUi.manageAccountNewPasswordToggle.addEventListener("click", () => {
			setManagePasswordVisibility(
				authUi.manageAccountNewPassword,
				authUi.manageAccountNewPasswordToggle,
				authUi.manageAccountNewPassword.type === "password",
				"new password",
			)
		})
	}
	if (authUi.manageAccountResetPasswordBtn) {
		authUi.manageAccountResetPasswordBtn.addEventListener("click", () => {
			void handleManageAccountResetPassword()
		})
	}
	if (authUi.manageAccountSavePreferencesBtn) {
		authUi.manageAccountSavePreferencesBtn.addEventListener(
			"click",
			handleManageAccountSavePreferences,
		)
	}
	if (authUi.manageAccountDeleteBtn) {
		authUi.manageAccountDeleteBtn.addEventListener("click", () => {
			void handleDeleteAccount()
		})
	}
	if (authUi.dashboardDeleteAccountBtn) {
		authUi.dashboardDeleteAccountBtn.addEventListener("click", () => {
			void handleDeleteAccount()
		})
	}
	if (authUi.deleteAccountConfirmBackdrop) {
		authUi.deleteAccountConfirmBackdrop.addEventListener("click", () => {
			closeDeleteAccountConfirmModal(false)
		})
	}
	if (authUi.deleteAccountConfirmCloseBtn) {
		authUi.deleteAccountConfirmCloseBtn.addEventListener("click", () => {
			closeDeleteAccountConfirmModal(false)
		})
	}
	if (authUi.deleteAccountConfirmCancelBtn) {
		authUi.deleteAccountConfirmCancelBtn.addEventListener("click", () => {
			closeDeleteAccountConfirmModal(false)
		})
	}
	if (authUi.deleteAccountConfirmProceedBtn) {
		authUi.deleteAccountConfirmProceedBtn.addEventListener("click", () => {
			closeDeleteAccountConfirmModal(true)
		})
	}
	if (authUi.dashboardFavoritesList) {
		authUi.dashboardFavoritesList.addEventListener("click", (event) => {
			const removeBtn = event.target.closest("[data-dashboard-favorite-remove]")
			const bookBtn = event.target.closest("[data-dashboard-favorite-book]")
			if (!removeBtn && !bookBtn) return

			const styleId =
				removeBtn?.dataset.dashboardFavoriteRemove ||
				bookBtn?.dataset.dashboardFavoriteBook ||
				""
			const style = dashboardFavoriteStyles.find(
				(item) => String(item.id || "") === String(styleId),
			)
			if (!style) return

			if (bookBtn) {
				selectService(style.styleName || style.styleType || "")
				return
			}

			void toggleFavoriteStyle(style, removeBtn)
		})
	}

	if (authUi.profileTrigger && authUi.profileMenu) {
		authUi.profileTrigger.addEventListener("click", () => {
			authUi.profileMenu.classList.toggle("open")
			const expanded = authUi.profileMenu.classList.contains("open")
			authUi.profileTrigger.setAttribute(
				"aria-expanded",
				expanded ? "true" : "false",
			)
		})

		if (authUi.profileDropdown) {
			authUi.profileDropdown.addEventListener("click", (event) => {
				const selectedMenuOption = event.target.closest("a, button")
				if (!selectedMenuOption) return
				closeAuthProfileMenu({ delay: 150 })
			})
		}

		document.addEventListener("click", (event) => {
			if (!authUi.profileMenu?.contains(event.target)) {
				closeAuthProfileMenu()
			}
		})
	}

	if (authUi.dashboardBookingsList) {
		authUi.dashboardBookingsList.addEventListener("click", (event) => {
			const actionBtn = event.target.closest("[data-dashboard-booking-action]")
			if (!actionBtn || !isNonGuestSignedIn()) return

			const action = String(actionBtn.dataset.dashboardBookingAction || "")
			const bookingId = String(actionBtn.dataset.bookingId || "")
			if (!action || !bookingId) return

			const booking = dashboardBookingDocs.find((item) => item.id === bookingId)
			if (!booking) return
			if (!isBookingActionable(booking)) {
				showTimedDashboardFavoritesMessage(
					"error",
					"❌ This booking is no longer active.",
				)
				return
			}

			if (action === "reschedule") {
				openDashboardRescheduleModal(booking)
				return
			}

			if (action === "cancel") {
				setButtonLoadingState(actionBtn, true, {
					loadingText: "Cancelling...",
				})
				void cancelDashboardBooking(bookingId)
					.then(async () => {
						await loadUserDashboardData(auth.currentUser)
						showTimedDashboardFavoritesMessage(
							"success",
							"✅ Booking cancelled and slot released.",
						)
					})
					.catch((error) => {
						console.error("Cancel booking failed:", error)
						showTimedDashboardFavoritesMessage(
							"error",
							`❌ ${error?.message || "Could not cancel booking."}`,
						)
					})
					.finally(() => {
						setButtonLoadingState(actionBtn, false)
					})
			}
		})
	}

	if (authUi.dashboardRescheduleBackdrop) {
		authUi.dashboardRescheduleBackdrop.addEventListener(
			"click",
			closeDashboardRescheduleModal,
		)
	}
	if (authUi.dashboardRescheduleCloseBtn) {
		authUi.dashboardRescheduleCloseBtn.addEventListener(
			"click",
			closeDashboardRescheduleModal,
		)
	}
	if (authUi.dashboardRescheduleCancelBtn) {
		authUi.dashboardRescheduleCancelBtn.addEventListener(
			"click",
			closeDashboardRescheduleModal,
		)
	}
	if (authUi.dashboardRescheduleDate) {
		authUi.dashboardRescheduleDate.addEventListener("change", () => {
			if (!dashboardRescheduleTarget) return
			subscribeToDashboardRescheduleAvailability(
				authUi.dashboardRescheduleDate.value,
				normalizeStylistKey(authUi.dashboardRescheduleStylist?.value || "any"),
				String(dashboardRescheduleTarget.slotId || ""),
			)
		})
	}
	if (authUi.dashboardRescheduleStylist) {
		authUi.dashboardRescheduleStylist.addEventListener("change", () => {
			if (!dashboardRescheduleTarget) return
			subscribeToDashboardRescheduleAvailability(
				String(authUi.dashboardRescheduleDate?.value || "").trim(),
				normalizeStylistKey(authUi.dashboardRescheduleStylist.value || "any"),
				String(dashboardRescheduleTarget.slotId || ""),
			)
		})
	}
	if (authUi.dashboardRescheduleSaveBtn) {
		authUi.dashboardRescheduleSaveBtn.addEventListener("click", () => {
			void saveDashboardRescheduleChanges()
		})
	}
}

function attachAuthStateObserver() {
	if (authObserverAttached || !auth) return
	authObserverAttached = true

	auth.onAuthStateChanged(async (user) => {
		if (user && !user.isAnonymous) {
			const allowed = await enforceSignedInUserSecurityRestrictions(user, {
				source: "auth-state",
			})
			if (!allowed) return

			setDashboardSignedInState(user)
			if (!currentSessionId) currentSessionId = generateSessionId()
			startSessionHeartbeat()
			await upsertUserProfile(user)
			await loadUserDashboardData(user)
			renderTestimonials(testimonialsData)
			focusDashboardAfterAuthIfRequested()
		} else {
			await markCurrentSessionOffline()
			stopSessionHeartbeat()
			currentSessionId = ""
			setDashboardPromptState()
			renderDashboardList(
				authUi.dashboardBookingsList,
				[],
				"Log in to view your appointments.",
			)
			renderDashboardList(
				authUi.dashboardReviewsList,
				[],
				"Log in to view your submitted reviews.",
			)
			renderTestimonials(testimonialsData)
		}
	})
}

function getSlotId(date, stylist, time) {
	const stylistKey = stylist && stylist.trim() ? stylist : "any"
	const normalizedTime = time.replace(/\s+/g, "").replace(/[:]/g, "")
	return `${date}__${stylistKey}__${normalizedTime}`
}

function getCurrentBookingFormDate() {
	return String(document.getElementById("datePicker")?.value || "").trim()
}

function getCurrentBookingFormStylistKey() {
	return normalizeStylistKey(
		document.getElementById("stylistSelect")?.value || "any",
	)
}

function normalizeTimeSlotLookupKey(value = "") {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "")
		.replace(/\./g, "")
}

function getCanonicalTimeSlotValue(value = "") {
	const lookupKey = normalizeTimeSlotLookupKey(value)
	if (!lookupKey) return ""
	return (
		timeSlots.find((slot) => normalizeTimeSlotLookupKey(slot) === lookupKey) ||
		""
	)
}

function getBookingTimePickerElements() {
	const input = document.getElementById("timeSelect")
	return {
		input,
		datalist: document.getElementById("bookingTimeOptions"),
		dropdown: document.getElementById("bookingTimeDropdown"),
		trigger: document.getElementById("timePickerTrigger"),
		field: input?.closest("[data-time-picker]") || input?.parentElement || null,
	}
}

function getBookingTimeSlotMeta(value = "") {
	const canonicalValue =
		getCanonicalTimeSlotValue(value) || String(value || "").trim()
	if (!canonicalValue) return null
	return currentBookingTimeSlotMeta.get(
		normalizeTimeSlotLookupKey(canonicalValue),
	)
}

function setBookingTimeDropdownExpanded(isExpanded = false) {
	const { input, dropdown, trigger } = getBookingTimePickerElements()
	if (dropdown) dropdown.hidden = !isExpanded
	if (input) input.setAttribute("aria-expanded", String(isExpanded))
	if (trigger) trigger.setAttribute("aria-expanded", String(isExpanded))
}

function renderBookingTimeDropdownOptions(filterValue = "") {
	const { input, dropdown } = getBookingTimePickerElements()
	if (!dropdown) return

	const selectedKey = normalizeTimeSlotLookupKey(input?.value || "")
	const filterText = String(filterValue || "")
		.trim()
		.toLowerCase()
	const visibleOptions = currentBookingTimeSlotOptions.filter((option) => {
		if (!filterText) return true
		return [option.value, option.label]
			.filter(Boolean)
			.some((item) => String(item).toLowerCase().includes(filterText))
	})

	dropdown.innerHTML = ""

	if (!visibleOptions.length) {
		const empty = document.createElement("span")
		empty.className = "time-picker-empty"
		empty.textContent = currentBookingTimeSlotOptions.length
			? "No matching times"
			: "No available times for this date/stylist"
		dropdown.appendChild(empty)
		return
	}

	visibleOptions.forEach((option) => {
		const optionButton = document.createElement("button")
		optionButton.type = "button"
		optionButton.className = "time-picker-option"
		if (option.booked && !option.waitlisted) {
			optionButton.classList.add("is-booked")
			optionButton.disabled = true
			optionButton.dataset.booked = "true"
			optionButton.setAttribute("aria-disabled", "true")
		}
		if (option.waitlisted) optionButton.classList.add("is-waitlisted")
		if (
			option.selectable &&
			normalizeTimeSlotLookupKey(option.value) === selectedKey
		) {
			optionButton.classList.add("is-selected")
		}
		optionButton.dataset.time = option.value
		optionButton.setAttribute("role", "option")
		optionButton.setAttribute(
			"aria-selected",
			normalizeTimeSlotLookupKey(option.value) === selectedKey
				? "true"
				: "false",
		)
		optionButton.textContent = option.label || option.value
		dropdown.appendChild(optionButton)
	})
}

function openBookingTimeDropdown() {
	const { input } = getBookingTimePickerElements()
	renderBookingTimeDropdownOptions(input?.value || "")
	setBookingTimeDropdownExpanded(true)
}

function closeBookingTimeDropdown() {
	setBookingTimeDropdownExpanded(false)
}

function selectBookingTimeSlot(value = "") {
	const { input } = getBookingTimePickerElements()
	const canonicalValue = getCanonicalTimeSlotValue(value)
	if (!input || !canonicalValue) return
	const selectedMeta = getBookingTimeSlotMeta(canonicalValue)
	if (selectedMeta && !selectedMeta.selectable) {
		renderBookingTimeDropdownOptions(input.value)
		return
	}

	input.value = canonicalValue
	renderBookingTimeDropdownOptions(canonicalValue)
	closeBookingTimeDropdown()
	input.dispatchEvent(new Event("change", { bubbles: true }))
	input.focus()
}

function validateBookingTimeSelection(
	timeValue = "",
	{ allowWaitlisted = false } = {},
) {
	const rawValue = String(timeValue || "").trim()
	if (!rawValue) {
		return { valid: false, message: "Please choose a time slot." }
	}

	const canonicalValue = getCanonicalTimeSlotValue(rawValue)
	if (!canonicalValue) {
		return {
			valid: false,
			message: "Please select one of the listed salon time slots.",
		}
	}

	const meta = getBookingTimeSlotMeta(canonicalValue)
	const matchesPendingWaitlist =
		allowWaitlisted &&
		pendingWaitlistBooking &&
		normalizeTimeSlotLookupKey(pendingWaitlistBooking.time) ===
			normalizeTimeSlotLookupKey(canonicalValue)

	if (meta?.booked && !meta?.waitlisted && !matchesPendingWaitlist) {
		return {
			valid: false,
			time: canonicalValue,
			message:
				"That time slot is already booked. Choose an available time or join the waitlist below.",
		}
	}

	if (meta?.waitlisted && !allowWaitlisted) {
		return {
			valid: false,
			time: canonicalValue,
			message:
				"This booked time is reserved for your waitlist confirmation. Choose an available time or confirm the waitlist request.",
		}
	}

	return { valid: true, time: canonicalValue, meta }
}

function bindBookingTimePickerControls() {
	if (bookingTimePickerControlsBound) return

	const { input, dropdown, trigger, field } = getBookingTimePickerElements()
	if (!input) return

	bookingTimePickerControlsBound = true

	input.addEventListener("input", () => {
		const pendingSelection = getMatchingPendingWaitlistBooking()
		if (
			pendingSelection &&
			normalizeTimeSlotLookupKey(input.value) !==
				normalizeTimeSlotLookupKey(pendingSelection.time)
		) {
			clearPendingWaitlistBooking({ refreshSlots: true })
			return
		}

		renderBookingTimeDropdownOptions(input.value)
		setBookingTimeDropdownExpanded(true)
	})

	input.addEventListener("change", handleBookingTimeSelectionChange)
	input.addEventListener("keydown", (event) => {
		if (event.key === "ArrowDown") {
			event.preventDefault()
			openBookingTimeDropdown()
			dropdown?.querySelector(".time-picker-option")?.focus()
		} else if (event.key === "Escape") {
			closeBookingTimeDropdown()
		}
	})

	trigger?.addEventListener("click", () => {
		if (dropdown && !dropdown.hidden) {
			closeBookingTimeDropdown()
		} else {
			openBookingTimeDropdown()
		}
		input.focus()
	})

	dropdown?.addEventListener("click", (event) => {
		const optionButton = event.target.closest(".time-picker-option")
		if (!optionButton) return
		selectBookingTimeSlot(optionButton.dataset.time || optionButton.textContent)
	})

	dropdown?.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closeBookingTimeDropdown()
			input.focus()
		}
	})

	document.addEventListener("click", (event) => {
		if (field && !field.contains(event.target)) {
			closeBookingTimeDropdown()
		}
	})
}

async function requestExpiredSlotCleanup(
	slotId = "",
	slotData = {},
	{ force = false } = {},
) {
	const safeSlotId = String(slotId || "").trim()
	if (!safeSlotId || !isBookingSlotExpired(slotData)) return false
	if (!appServicesReady || !callableService || !auth?.currentUser) return false

	const nowMs = Date.now()
	const lastRequestedAt = expiredSlotCleanupRequestTimes.get(safeSlotId) || 0
	if (
		!force &&
		lastRequestedAt &&
		nowMs - lastRequestedAt < EXPIRED_SLOT_CLEANUP_THROTTLE_MS
	) {
		return false
	}

	expiredSlotCleanupRequestTimes.set(safeSlotId, nowMs)

	try {
		await callClientReleaseExpiredBookingSlotAction(safeSlotId)
		return true
	} catch (error) {
		console.warn("Expired booking slot cleanup request failed:", error)
		return false
	}
}

function getMatchingPendingWaitlistBooking() {
	if (!pendingWaitlistBooking) return null

	const dateValue = getCurrentBookingFormDate()
	const currentStylistKey = getCurrentBookingFormStylistKey()
	const waitlistStylistKey = normalizeStylistKey(
		pendingWaitlistBooking.stylistKey || "any",
	)
	const sameDate =
		String(pendingWaitlistBooking.date || "").trim() === dateValue
	const sameStylist =
		currentStylistKey === "any" ||
		waitlistStylistKey === "any" ||
		waitlistStylistKey === currentStylistKey

	if (!sameDate || !sameStylist) return null
	if (!pendingWaitlistBooking.time || !pendingWaitlistBooking.slotId)
		return null
	return pendingWaitlistBooking
}

function setPendingWaitlistBooking(selection = {}) {
	pendingWaitlistBooking = {
		date: String(selection.date || "").trim(),
		time: String(selection.time || "").trim(),
		slotId: String(selection.slotId || "").trim(),
		stylistKey: normalizeStylistKey(selection.stylistKey || "any"),
		waitlistId: String(selection.waitlistId || "").trim(),
		inspirationImageUrl: String(selection.inspirationImageUrl || "").trim(),
	}
}

function clearPendingWaitlistBooking({ refreshSlots = false } = {}) {
	pendingWaitlistBooking = null
	if (refreshSlots) {
		renderBookingTimeSlots(currentBookedSlotEntries)
	}
}

function getSortedBookedSlotEntries(entries = []) {
	return [...entries].sort((a, b) => {
		const aIndex = timeSlots.indexOf(a.time)
		const bIndex = timeSlots.indexOf(b.time)
		const safeAIndex = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex
		const safeBIndex = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex
		if (safeAIndex !== safeBIndex) return safeAIndex - safeBIndex
		return String(a.stylistLabel || "").localeCompare(
			String(b.stylistLabel || ""),
		)
	})
}

function renderWaitlistPanel(bookedEntries = []) {
	const panel = document.getElementById("waitlistPanel")
	const waitlistSelect = document.getElementById("waitlistTimeSelect")
	const joinBtn = document.getElementById("joinWaitlistBtn")
	if (!panel || !waitlistSelect || !joinBtn) return

	currentBookedSlotEntries = getSortedBookedSlotEntries(
		bookedEntries.filter((entry) => entry?.time && entry?.slotId),
	)

	waitlistSelect.innerHTML = '<option value="">Select booked time</option>'
	currentBookedSlotEntries.forEach((entry) => {
		const opt = document.createElement("option")
		opt.value = entry.slotId
		opt.dataset.time = entry.time
		opt.dataset.stylistKey = entry.stylistKey || "any"
		opt.textContent = `${entry.time} — ${entry.stylistLabel || "Booked"}`
		waitlistSelect.appendChild(opt)
	})

	const hasBookedSlots = currentBookedSlotEntries.length > 0
	const pendingSelection = getMatchingPendingWaitlistBooking()
	if (pendingSelection) {
		waitlistSelect.value = pendingSelection.slotId
	}
	panel.classList.toggle("hidden", !hasBookedSlots)
	joinBtn.disabled = !hasBookedSlots
}

function renderBookingTimeSlots(bookedEntries = []) {
	const { input, datalist } = getBookingTimePickerElements()
	if (!input) return

	const previousSelection = String(input.value || "").trim()
	const bookedTimeSet = new Set(
		bookedEntries
			.map((entry) => String(entry?.time || "").trim())
			.filter(Boolean),
	)
	const pendingSelection = getMatchingPendingWaitlistBooking()

	currentBookingTimeSlotOptions = []
	currentBookingTimeSlotMeta = new Map()
	if (datalist) datalist.innerHTML = ""

	timeSlots.forEach((slot) => {
		const isWaitlistedSelection = pendingSelection?.time === slot
		const isBooked = bookedTimeSet.has(slot)
		const label = isWaitlistedSelection
			? `${slot} — Waitlisted (booked)`
			: isBooked
				? `${slot} — Booked`
				: slot
		const meta = {
			value: slot,
			label,
			booked: isBooked,
			waitlisted: isWaitlistedSelection,
			slotId: isWaitlistedSelection ? pendingSelection.slotId : "",
			stylistKey: isWaitlistedSelection
				? pendingSelection.stylistKey || "any"
				: "",
			selectable: !isBooked || isWaitlistedSelection,
		}

		if (isWaitlistedSelection) {
			meta.slotId = pendingSelection.slotId
			meta.stylistKey = pendingSelection.stylistKey || "any"
		}

		currentBookingTimeSlotMeta.set(normalizeTimeSlotLookupKey(slot), meta)
		currentBookingTimeSlotOptions.push(meta)
	})

	if (datalist) {
		currentBookingTimeSlotOptions
			.filter((option) => option.selectable)
			.forEach((option) => {
				const datalistOption = document.createElement("option")
				datalistOption.value = option.value
				datalistOption.label = option.label
				if (option.waitlisted) {
					datalistOption.dataset.waitlisted = "true"
					datalistOption.dataset.slotId = option.slotId
					datalistOption.dataset.stylistKey = option.stylistKey || "any"
				}
				datalist.appendChild(datalistOption)
			})
	}

	if (pendingSelection?.time) {
		input.value = pendingSelection.time
	} else {
		const canonicalPreviousSelection =
			getCanonicalTimeSlotValue(previousSelection)
		const previousMeta = canonicalPreviousSelection
			? getBookingTimeSlotMeta(canonicalPreviousSelection)
			: null
		input.value = previousMeta?.selectable ? canonicalPreviousSelection : ""
	}

	renderBookingTimeDropdownOptions(input.value)
	renderWaitlistPanel(bookedEntries)
}

function getBookingFormDataForWaitlist(timeOverride = "") {
	const form = document.getElementById("bookingForm")
	const data = form ? Object.fromEntries(new FormData(form).entries()) : {}
	const customServiceInput = document.getElementById("customServiceInput")
	const customServiceValue = String(customServiceInput?.value || "").trim()

	if (data.service === CUSTOM_SERVICE_OPTION_VALUE) {
		data.service = customServiceValue
	}

	if (timeOverride) {
		data.time = String(timeOverride || "").trim()
	}

	return data
}

function validateWaitlistBookingData(data = {}) {
	if (!String(data.firstName || "").trim())
		return "Please enter your first name."
	if (!String(data.lastName || "").trim()) return "Please enter your last name."
	if (!String(data.email || "").trim()) return "Please enter your email."
	if (!String(data.phone || "").trim()) return "Please enter your phone number."
	if (!String(data.service || "").trim())
		return "Please select or type a service."
	if (!String(data.date || "").trim()) return "Please choose a date."
	if (!String(data.time || "").trim()) return "Please choose a booked time."
	return ""
}

function clearWaitlistJoinedButtonFeedback(button = null, resetText = true) {
	if (waitlistJoinFeedbackTimer) {
		clearTimeout(waitlistJoinFeedbackTimer)
		waitlistJoinFeedbackTimer = null
	}

	if (resetText && button) {
		button.textContent = "Join Waitlist"
		button.dataset.originalLabel = "Join Waitlist"
	}
}

function showWaitlistJoinedButtonFeedback(button, duration = 2500) {
	if (!button) return

	clearWaitlistJoinedButtonFeedback(button, false)
	button.textContent = "Joined"
	button.dataset.originalLabel = "Join Waitlist"

	waitlistJoinFeedbackTimer = setTimeout(() => {
		button.textContent = "Join Waitlist"
		button.dataset.originalLabel = "Join Waitlist"
		waitlistJoinFeedbackTimer = null
	}, duration)
}

async function getOrCreateBookingSessionUid() {
	if (!auth) return null
	if (auth.currentUser) {
		return auth.currentUser.uid
	}

	const userCredential = await auth.signInAnonymously()
	return userCredential?.user?.uid || auth.currentUser?.uid || null
}

async function handleJoinWaitlistButtonClick() {
	const waitlistSelect = document.getElementById("waitlistTimeSelect")
	const joinBtn = document.getElementById("joinWaitlistBtn")
	const msg = document.getElementById("bookingMessage")
	const imageInput = document.getElementById("inspirationImage")
	const selectedOption = waitlistSelect?.options?.[waitlistSelect.selectedIndex]
	const selectedTime = String(selectedOption?.dataset?.time || "").trim()
	const selectedSlotId = String(selectedOption?.value || "").trim()
	let joinedSuccessfully = false

	clearWaitlistJoinedButtonFeedback(joinBtn)

	if (!selectedTime || !selectedSlotId) {
		showTimedFormMessage(
			msg,
			"error",
			"⚠️ Please select the booked time you want to waitlist for.",
		)
		return
	}

	const data = getBookingFormDataForWaitlist(selectedTime)
	const validationError = validateWaitlistBookingData(data)
	if (validationError) {
		showTimedFormMessage(msg, "error", `⚠️ ${validationError}`)
		return
	}

	if (!appServicesReady || !db || !auth) {
		showTimedFormMessage(
			msg,
			"error",
			"⚠️ Waitlist service is not configured yet. Check Supabase/Render settings in client-config.js.",
		)
		return
	}

	clearFormMessage(msg)
	setButtonLoadingState(joinBtn, true, { loadingText: "Joining..." })

	try {
		const slotDoc = await db
			.collection("bookingSlots")
			.doc(selectedSlotId)
			.get()
		const slotData = slotDoc.exists ? slotDoc.data() || {} : {}
		if (
			slotDoc.exists &&
			slotData.taken === true &&
			isBookingSlotExpired(slotData)
		) {
			await requestExpiredSlotCleanup(selectedSlotId, slotData, { force: true })
		}
		if (
			!slotDoc.exists ||
			slotData.taken !== true ||
			isBookingSlotExpired(slotData)
		) {
			throw new Error(
				"This slot just opened. Please select it from Time Slot and confirm your booking.",
			)
		}

		const activeUid = await getOrCreateBookingSessionUid()
		if (!activeUid) {
			throw new Error(
				"Unable to authenticate waitlist session. Please refresh and try again.",
			)
		}

		let inspirationImageUrl = ""
		const selectedFile = imageInput?.files?.[0]
		if (selectedFile) {
			inspirationImageUrl = await uploadImageToCloudinary(selectedFile, {
				purpose: "booking-inspiration",
				tags: ["public_upload", "booking_inspiration", "waitlist"],
				context: { section: "booking", flow: "waitlist" },
			})
		}

		const waitlistStylistKey = normalizeStylistKey(
			selectedOption?.dataset?.stylistKey || data.stylist || "any",
		)
		const waitlistBookingData = {
			...data,
			time: selectedTime,
			stylist:
				waitlistStylistKey === "any"
					? ""
					: getStylistDisplayName(waitlistStylistKey),
		}

		const waitlistId = await joinWaitlistForUnavailableSlot({
			bookingData: waitlistBookingData,
			stylistKey: waitlistStylistKey,
			activeUid,
			slotId: selectedSlotId,
			inspirationImageUrl,
		})
		setPendingWaitlistBooking({
			date: data.date,
			time: selectedTime,
			slotId: selectedSlotId,
			stylistKey: waitlistStylistKey,
			waitlistId,
			inspirationImageUrl,
		})
		renderBookingTimeSlots(currentBookedSlotEntries)
		joinedSuccessfully = true

		showTimedFormMessage(
			msg,
			"success",
			`✅ You have joined the waitlist for ${selectedTime}. Now click Confirm Booking to save this waitlisted appointment to your dashboard.`,
			6000,
		)
	} catch (error) {
		console.error("Manual waitlist join failed:", error)
		showTimedFormMessage(
			msg,
			"error",
			`❌ ${error?.message || "Could not join waitlist. Please try again."}`,
		)
	} finally {
		setButtonLoadingState(joinBtn, false, { resetText: "Join Waitlist" })
		if (joinedSuccessfully) {
			showWaitlistJoinedButtonFeedback(joinBtn)
		}
	}
}

function bindWaitlistControls() {
	document
		.getElementById("joinWaitlistBtn")
		?.addEventListener("click", handleJoinWaitlistButtonClick)
}

const REVIEW_RATE_LIMIT_COOLDOWN_MS = 2 * 60 * 1000
const CONTACT_RATE_LIMIT_COOLDOWN_MS = 60 * 1000

function getRateLimitDocId(kind = "", uid = "") {
	const safeUid = String(uid || "").trim()
	if (!safeUid) return ""
	return safeUid
}

function buildRateLimitPayload(kind = "", uid = "", cooldownMs = 0) {
	const nowMs = Date.now()
	const safeCooldown = Math.max(0, Number(cooldownMs || 0))
	const safeKind = String(kind || "")
		.trim()
		.toLowerCase()
	const payload = {
		kind: String(kind || "")
			.trim()
			.toLowerCase(),
		uid: String(uid || "").trim(),
		lastSubmittedAt: getServerTimestamp(),
		updatedAt: getServerTimestamp(),
	}

	const cooldownUntil = getTimestampFromMillis(nowMs + safeCooldown)
	if (safeKind === "review") {
		payload.reviewCooldownUntil = cooldownUntil
	} else if (safeKind === "contact") {
		payload.contactCooldownUntil = cooldownUntil
	}

	return payload
}

async function joinWaitlistForUnavailableSlot({
	bookingData = {},
	stylistKey = "any",
	activeUid = "",
	slotId = "",
	inspirationImageUrl = "",
} = {}) {
	if (!appServicesReady || !db || !activeUid || !slotId) return false

	const waitlistPayload = {
		firstName: String(bookingData.firstName || "").trim(),
		lastName: String(bookingData.lastName || "").trim(),
		email: String(bookingData.email || "")
			.trim()
			.toLowerCase(),
		phone: String(bookingData.phone || "").trim(),
		service: String(bookingData.service || "").trim(),
		stylist: String(bookingData.stylist || "").trim(),
		stylistKey: normalizeStylistKey(stylistKey || bookingData.stylist || "any"),
		preferredDate: String(bookingData.date || "").trim(),
		preferredTime: String(bookingData.time || "").trim(),
		preferredSlotId: String(slotId || "").trim(),
		notes: String(bookingData.notes || "").trim(),
		inspirationImageUrl: String(inspirationImageUrl || "").trim(),
		status: "waiting",
		notifiedAt: null,
		uid: String(activeUid || "").trim(),
		createdAt: getServerTimestamp(),
		updatedAt: getServerTimestamp(),
	}

	const waitlistDocRef = await db.collection("waitlist").add(waitlistPayload)
	return waitlistDocRef?.id || true
}

function normalizeCloudinarySignatureResponse(signResponse = {}) {
	const payload = signResponse?.data || signResponse || {}
	if (payload.uploadUrl) return payload
	if (payload.signature?.uploadUrl) return payload.signature
	if (payload.signedUpload?.uploadUrl) return payload.signedUpload
	return payload
}

function serializeCloudinarySignedParam(key, value) {
	if (value === undefined || value === null || value === "") return ""
	if (key === "tags" && Array.isArray(value)) {
		return value
			.map((tag) => String(tag || "").trim())
			.filter(Boolean)
			.join(",")
	}
	if (
		key === "context" &&
		value &&
		typeof value === "object" &&
		!Array.isArray(value)
	) {
		return Object.entries(value)
			.filter(
				([_contextKey, contextValue]) =>
					contextValue !== undefined &&
					contextValue !== null &&
					contextValue !== "",
			)
			.map(
				([contextKey, contextValue]) => `${contextKey}=${String(contextValue)}`,
			)
			.join("|")
	}
	if (Array.isArray(value)) {
		return value
			.map((item) => String(item || "").trim())
			.filter(Boolean)
			.join(",")
	}
	return String(value)
}

function appendCloudinarySignedParams(body, signatureData = {}) {
	const signedParams =
		signatureData.params && typeof signatureData.params === "object"
			? signatureData.params
			: {
					timestamp: signatureData.timestamp,
					folder: signatureData.folder || clientCloudinaryFolder,
					public_id: signatureData.publicId || signatureData.public_id,
					upload_preset:
						signatureData.uploadPreset || signatureData.upload_preset,
					eager: signatureData.eager,
					tags: signatureData.tags,
					context: signatureData.context,
					api_key: signatureData.apiKey || signatureData.api_key,
					signature: signatureData.signature,
				}

	Object.entries(signedParams).forEach(([key, value]) => {
		const serializedValue = serializeCloudinarySignedParam(key, value)
		if (!serializedValue) return
		body.append(key, serializedValue)
	})

	const apiKey = signatureData.apiKey || signatureData.api_key
	if (!signedParams.api_key && apiKey) {
		body.append("api_key", apiKey)
	}
	if (!signedParams.signature && signatureData.signature) {
		body.append("signature", signatureData.signature)
	}
}

async function getCloudinaryUploadErrorMessage(response) {
	try {
		const payload = await response.json()
		return payload?.error?.message || payload?.message || ""
	} catch (_error) {
		return response.text().catch(() => "")
	}
}

async function uploadImageToCloudinary(file, options = {}) {
	if (!file) return ""
	if (
		!appServicesReady ||
		!callableService ||
		typeof callableService.httpsCallable !== "function"
	) {
		throw new Error("Render API action service is not ready yet.")
	}
	if (file.type && !String(file.type).toLowerCase().startsWith("image/")) {
		throw new Error("Only image files can be uploaded.")
	}
	if (file.size && file.size > 5 * 1024 * 1024) {
		throw new Error("Image uploads must be 5MB or less.")
	}

	const signUploadCallable = callableService.httpsCallable(
		"createCloudinarySignedUpload",
	)
	const purpose = options.purpose || "booking-inspiration"
	const signResponse = await signUploadCallable({
		purpose,
		folder: options.folder || clientCloudinaryFolder,
		tags: options.tags || ["public_upload", purpose],
		context: {
			page: "public",
			...(options.context || {}),
		},
		fileName: file.name || "",
		contentType: file.type || "image/*",
		sizeBytes: file.size || 0,
	})
	const signatureData = normalizeCloudinarySignatureResponse(signResponse)
	const signedParams =
		signatureData.params && typeof signatureData.params === "object"
			? signatureData.params
			: {}

	if (
		!signatureData.uploadUrl ||
		!(signatureData.apiKey || signatureData.api_key || signedParams.api_key) ||
		!(signatureData.signature || signedParams.signature)
	) {
		throw new Error("Failed to initialize secure Cloudinary upload")
	}

	const body = new FormData()
	body.append("file", file)
	appendCloudinarySignedParams(body, signatureData)

	const response = await fetch(signatureData.uploadUrl, {
		method: "POST",
		body,
	})

	if (!response.ok) {
		const cloudinaryError = await getCloudinaryUploadErrorMessage(response)
		throw new Error(cloudinaryError || "Failed to upload image to Cloudinary")
	}

	const result = await response.json()
	return result.secure_url || ""
}

function subscribeToAvailability(date, stylist) {
	if (!appServicesReady || !db || !date) return

	if (typeof activeAvailabilityUnsubscribe === "function") {
		activeAvailabilityUnsubscribe()
		activeAvailabilityUnsubscribe = null
	}

	const stylistKey = normalizeStylistKey(stylist || "any")
	const timeSelect = document.getElementById("timeSelect")
	const startId = `${date}__`
	const endId = `${date}__\uf8ff`

	const query = db
		.collection("bookingSlots")
		.where(getDocumentIdField(), ">=", startId)
		.where(getDocumentIdField(), "<=", endId)

	activeAvailabilityUnsubscribe = query.onSnapshot(
		(snapshot) => {
			const bookedEntries = []
			snapshot.forEach((doc) => {
				const data = doc.data() || {}
				const time = String(data.time || "").trim()
				if (data.taken && isBookingSlotExpired(data)) {
					void requestExpiredSlotCleanup(doc.id, data)
					return
				}
				const docStylistKey = normalizeStylistKey(
					data.stylistKey || data.stylist || "any",
				)
				const blocksSelectedStylist =
					stylistKey === "any"
						? true
						: docStylistKey === stylistKey || docStylistKey === "any"

				if (data.taken && time && blocksSelectedStylist) {
					bookedEntries.push({
						slotId: doc.id,
						time,
						stylistKey: docStylistKey,
						stylistLabel: getStylistDisplayName(docStylistKey),
					})
				}
			})

			renderBookingTimeSlots(bookedEntries)
		},
		(error) => {
			console.error("Realtime availability listener failed:", error)
			if (timeSelect) renderBookingTimeSlots([])
		},
	)
}

function handleAvailabilityWatch() {
	const dateValue = document.getElementById("datePicker").value
	const stylistValue = document.getElementById("stylistSelect").value
	if (!dateValue) {
		if (typeof activeAvailabilityUnsubscribe === "function") {
			activeAvailabilityUnsubscribe()
			activeAvailabilityUnsubscribe = null
		}
		populateTimeSlots()
		return
	}

	if (appServicesReady) {
		subscribeToAvailability(dateValue, stylistValue)
	} else {
		populateTimeSlots()
	}
}

function handleBookingAvailabilityInputChange() {
	clearPendingWaitlistBooking()
	handleAvailabilityWatch()
}

function handleBookingTimeSelectionChange() {
	const { input } = getBookingTimePickerElements()
	if (!input) return

	const canonicalSelection = getCanonicalTimeSlotValue(input.value)
	if (canonicalSelection && input.value.trim() !== canonicalSelection) {
		input.value = canonicalSelection
	}

	const selectedMeta = canonicalSelection
		? getBookingTimeSlotMeta(canonicalSelection)
		: null
	if (selectedMeta && !selectedMeta.selectable) {
		input.value = ""
		renderBookingTimeDropdownOptions("")
		return
	}

	const stillConfirmingPendingWaitlist =
		selectedMeta?.waitlisted &&
		pendingWaitlistBooking &&
		normalizeTimeSlotLookupKey(canonicalSelection) ===
			normalizeTimeSlotLookupKey(pendingWaitlistBooking.time)

	if (pendingWaitlistBooking && !stillConfirmingPendingWaitlist) {
		clearPendingWaitlistBooking({ refreshSlots: true })
		return
	}

	renderBookingTimeDropdownOptions(input.value)
}

function setBookingSuccessContent(mode = "confirmed") {
	const bookingSuccess = document.getElementById("bookingSuccess")
	if (!bookingSuccess) return

	const title = bookingSuccess.querySelector("h3")
	const desc = bookingSuccess.querySelector("p")

	if (mode === "waitlisted") {
		if (title) title.textContent = "Waitlist Request Saved!"
		if (desc) {
			desc.textContent =
				"Your waitlisted appointment has been saved. It will appear in your dashboard and the admin bookings list while you wait for the slot to open."
		}
		return
	}

	if (title) title.textContent = "Booking Confirmed!"
	if (desc) {
		desc.textContent =
			"Check your email for confirmation details. We'll send a reminder on Whatsapp 2 Hours before your appointment."
	}
}

// ============ RENDER FUNCTIONS ============

function renderServices(filter = "all") {
	const grid = document.getElementById("servicesGrid")
	if (!grid) return
	const visibleServices = getVisibleServicesData()
	const requestedFilter = String(filter || "all")
	const normalizedFilter =
		requestedFilter !== "all" &&
		enabledServiceCategories[requestedFilter] === false
			? "all"
			: requestedFilter
	activeServicesFilter = normalizedFilter

	const getCategoryLabel = (categoryKey = "") => {
		if (SERVICE_CATEGORY_LABEL_MAP[categoryKey]) {
			return SERVICE_CATEGORY_LABEL_MAP[categoryKey]
		}
		return String(categoryKey || "")
			.replace(/-/g, " ")
			.replace(/\b\w/g, (m) => m.toUpperCase())
	}

	const renderServiceCard = (service, index = 0) => {
		const safeServiceId = service.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
		return `
    <div class="service-card animate-on-scroll visible delay-${(index % 4) + 1}" id="service-${safeServiceId}">
      <div class="service-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths[service.icon] || iconPaths.scissors}</svg>
      </div>
      <h3>${service.name}</h3>
      <p>${service.desc}</p>
      <div>
        <span class="service-price">${service.price}</span>
        <span class="service-duration">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          ${service.duration}
        </span>
      </div>
      <button class="service-book-btn" onclick="selectService('${service.name}')">Book This Service</button>
    </div>
  `
	}

	if (normalizedFilter !== "all") {
		grid.classList.remove("is-grouped")
		const filtered = visibleServices.filter(
			(s) => s.category === normalizedFilter,
		)
		grid.innerHTML = filtered.map((s, i) => renderServiceCard(s, i)).join("")
		return
	}

	grid.classList.add("is-grouped")
	const categoryOrder = [...new Set(visibleServices.map((s) => s.category))]
	grid.innerHTML = categoryOrder
		.map((categoryKey) => {
			const categoryServices = visibleServices.filter(
				(service) => service.category === categoryKey,
			)
			if (!categoryServices.length) return ""

			return `
      <section class="services-category-group" data-category="${categoryKey}">
        <header class="services-category-header">
          <h3 class="services-category-title">${getCategoryLabel(categoryKey)}</h3>
          <p class="services-category-count">${categoryServices.length} service${categoryServices.length === 1 ? "" : "s"}</p>
        </header>
        <div class="services-category-grid">
          ${categoryServices.map((service, index) => renderServiceCard(service, index)).join("")}
        </div>
      </section>
    `
		})
		.join("")
}

function normalizeGalleryItem(item = {}) {
	const styleName = item.styleName || item.title || "Untitled Style"
	const styleType = item.styleType || "General"
	const stylistName = item.stylistName || item.stylist || "Royal Braids Team"
	const serviceName = item.serviceName || styleName
	const serviceCategory = inferGalleryServiceCategory(item)
	const hairServiceType = String(item.hairServiceType || "").trim()
	const hairTechnique = String(item.hairTechnique || "").trim()
	const subService =
		String(
			item.subService ||
				(serviceCategory === "hair-services" ? hairServiceType : "") ||
				serviceName ||
				styleType,
		).trim() || styleType
	const imageUrl = item.imageUrl || item.img || ""
	const beforeImageUrl = item.beforeImageUrl || ""
	const hasBeforeAfter =
		item.hasBeforeAfter === true ||
		item.beforeAfter === true ||
		Boolean(beforeImageUrl)

	return {
		id: item.id || "",
		styleName,
		styleType,
		subService,
		serviceName,
		serviceCategory,
		serviceLabel: getGalleryServiceLabel(serviceCategory),
		stylistName,
		length: item.length || "Medium",
		size: item.size || "Medium",
		timeTaken: item.timeTaken || "N/A",
		priceRange: item.priceRange || "On request",
		hairType: item.hairType || "N/A",
		hairServiceType,
		hairTechnique,
		hairLengthDensity: String(item.hairLengthDensity || "").trim(),
		hairProductsUsed: String(item.hairProductsUsed || "").trim(),
		imageUrl,
		beforeImageUrl,
		hasBeforeAfter,
		featuredTrending: item.featuredTrending === true,
		featuredMostBooked: item.featuredMostBooked === true,
		createdAt: item.createdAt || item.created_at || item.createdOn || null,
		updatedAt: item.updatedAt || item.updated_at || item.updatedOn || null,
	}
}

function getGalleryItemsForFilterScope(
	categoryKey = galleryFiltersState.service,
) {
	const normalizedCategory = String(categoryKey || "all")
		.trim()
		.toLowerCase()
	return galleryData.filter((item) => {
		if (!isServiceCategoryEnabled(item.serviceCategory)) return false
		return (
			normalizedCategory === "all" ||
			item.serviceCategory === normalizedCategory
		)
	})
}

function getUniqueGalleryValues(key, sourceItems = galleryData) {
	const values = sourceItems
		.map((item) => item[key])
		.map((value) => String(value || "").trim())
		.filter(Boolean)
	return [...new Set(values)].sort((a, b) =>
		a.localeCompare(b, undefined, { sensitivity: "base" }),
	)
}

function getGallerySubFilterConfigs(categoryKey = galleryFiltersState.service) {
	const normalizedCategory = String(categoryKey || "all")
		.trim()
		.toLowerCase()
	if (normalizedCategory === "all") return []

	if (normalizedCategory === "braids-services") {
		return [
			{ key: "length", mountId: "galleryLengthFilters", label: "Lengths" },
			{ key: "size", mountId: "gallerySizeFilters", label: "Sizes" },
			{
				key: "styleType",
				mountId: "galleryStyleTypeFilters",
				label: "Style Types",
			},
		]
	}

	if (normalizedCategory === "hair-services") {
		return [
			{
				key: "subService",
				mountId: "galleryLengthFilters",
				label: "Hair Services",
			},
			{
				key: "technique",
				valueKey: "hairTechnique",
				mountId: "gallerySizeFilters",
				label: "Techniques / Finishes",
			},
			{
				key: "styleType",
				mountId: "galleryStyleTypeFilters",
				label: "Style Types",
			},
		]
	}

	return [
		{
			key: "subService",
			mountId: "galleryLengthFilters",
			label: `${getGalleryServiceLabel(normalizedCategory)} Services`,
		},
		{
			key: "styleType",
			mountId: "galleryStyleTypeFilters",
			label: "Style Types",
		},
	]
}

function renderGalleryFilterGroup(config, sourceItems = galleryData) {
	const groupKey = config?.key || ""
	const valueKey = config?.valueKey || groupKey
	const mountId = config?.mountId || ""
	const prefixLabel = config?.label || "Filters"
	const mount = document.getElementById(mountId)
	if (!mount || !groupKey) return false

	const activeValue = galleryFiltersState[groupKey] || "all"
	const values = getUniqueGalleryValues(valueKey, sourceItems)
	if (!values.length) {
		galleryFiltersState[groupKey] = "all"
		mount.innerHTML = ""
		mount.style.display = "none"
		return false
	}

	if (activeValue !== "all" && !values.includes(activeValue)) {
		galleryFiltersState[groupKey] = "all"
	}
	const safeActiveValue = galleryFiltersState[groupKey] || "all"
	mount.style.display = "flex"

	mount.innerHTML = `
		<button class="gallery-filter-chip ${safeActiveValue === "all" ? "active" : ""}" data-filter-group="${groupKey}" data-filter-value="all">
			All ${escapeHtml(prefixLabel)}
		</button>
		${values
			.map(
				(value) => `
					<button class="gallery-filter-chip ${safeActiveValue === value ? "active" : ""}" data-filter-group="${groupKey}" data-filter-value="${escapeHtml(value)}">
						${escapeHtml(value)}
					</button>
				`,
			)
			.join("")}
	`
	return true
}

function renderGalleryFilters() {
	const serviceWrap = document.getElementById("galleryServiceFilters")
	if (serviceWrap) {
		serviceWrap.innerHTML = GALLERY_SERVICE_FILTER_DEFINITIONS.filter(
			(item) => item.key === "all" || isServiceCategoryEnabled(item.key),
		)
			.map((item) => {
				const active = galleryFiltersState.service === item.key
				return `<button class="gallery-filter-chip ${active ? "active" : ""}" data-filter-group="service" data-filter-value="${item.key}">${item.label}</button>`
			})
			.join("")
	}

	const selectedService = galleryFiltersState.service || "all"
	const subFilterConfigs = getGallerySubFilterConfigs(selectedService)
	const scopedItems = getGalleryItemsForFilterScope(selectedService)
	const note = document.getElementById("galleryBraidsOnlyNote")
	const filterGroupMounts = [
		document.getElementById("galleryLengthFilters"),
		document.getElementById("gallerySizeFilters"),
		document.getElementById("galleryStyleTypeFilters"),
	]
	filterGroupMounts.forEach((group) => {
		if (!group) return
		group.style.display = "none"
		group.innerHTML = ""
	})

	let renderedGroupCount = 0
	subFilterConfigs.forEach((config) => {
		if (renderGalleryFilterGroup(config, scopedItems)) renderedGroupCount += 1
	})

	if (note) {
		note.style.display = renderedGroupCount ? "block" : "none"
		if (renderedGroupCount) {
			const serviceLabel = getGalleryServiceLabel(selectedService)
			note.textContent = `${serviceLabel} filters update automatically from added gallery sub-services.`
		}
	}
}

function applyGalleryFilters() {
	const activeSubFilterConfigs = getGallerySubFilterConfigs(
		galleryFiltersState.service,
	)

	filteredGalleryData = galleryData.filter((item) => {
		if (!isServiceCategoryEnabled(item.serviceCategory)) {
			return false
		}

		if (
			galleryFiltersState.service !== "all" &&
			item.serviceCategory !== galleryFiltersState.service
		) {
			return false
		}

		for (const config of activeSubFilterConfigs) {
			const groupKey = config.key
			const valueKey = config.valueKey || groupKey
			const activeValue = galleryFiltersState[groupKey] || "all"
			if (activeValue === "all") continue
			if (String(item[valueKey] || "").trim() !== activeValue) {
				return false
			}
		}
		return true
	})

	filteredGalleryData = sortGalleryItems(filteredGalleryData, gallerySortBy)
}

function parseItemTimeValue(item, keys = ["updatedAt", "createdAt"]) {
	for (const key of keys) {
		const raw = item?.[key]
		if (!raw) continue
		if (typeof raw?.toMillis === "function") return raw.toMillis()
		if (typeof raw === "number" && Number.isFinite(raw)) return raw
		if (raw?.seconds && Number.isFinite(raw.seconds)) return raw.seconds * 1000
		const parsed = Date.parse(String(raw))
		if (!Number.isNaN(parsed)) return parsed
	}
	return 0
}

function sortGalleryItems(items = [], sortBy = "recommended") {
	const data = [...items]

	const byNameAsc = (a, b) =>
		String(a.styleName || "").localeCompare(
			String(b.styleName || ""),
			undefined,
			{
				sensitivity: "base",
			},
		)

	if (sortBy === "name-asc") {
		return data.sort(byNameAsc)
	}

	if (sortBy === "name-desc") {
		return data.sort((a, b) => byNameAsc(b, a))
	}

	if (sortBy === "date-modified-desc" || sortBy === "new") {
		return data.sort(
			(a, b) =>
				parseItemTimeValue(b, ["updatedAt", "createdAt"]) -
				parseItemTimeValue(a, ["updatedAt", "createdAt"]),
		)
	}

	if (sortBy === "date-modified-asc" || sortBy === "old") {
		return data.sort(
			(a, b) =>
				parseItemTimeValue(a, ["updatedAt", "createdAt"]) -
				parseItemTimeValue(b, ["updatedAt", "createdAt"]),
		)
	}

	if (sortBy === "date-created-desc") {
		return data.sort(
			(a, b) =>
				parseItemTimeValue(b, ["createdAt", "updatedAt"]) -
				parseItemTimeValue(a, ["createdAt", "updatedAt"]),
		)
	}

	if (sortBy === "date-created-asc") {
		return data.sort(
			(a, b) =>
				parseItemTimeValue(a, ["createdAt", "updatedAt"]) -
				parseItemTimeValue(b, ["createdAt", "updatedAt"]),
		)
	}

	return data.sort((a, b) => {
		const scoreA =
			(a.featuredTrending ? 2 : 0) +
			(a.featuredMostBooked ? 2 : 0) +
			(a.hasBeforeAfter ? 1 : 0)
		const scoreB =
			(b.featuredTrending ? 2 : 0) +
			(b.featuredMostBooked ? 2 : 0) +
			(b.hasBeforeAfter ? 1 : 0)

		if (scoreA !== scoreB) return scoreB - scoreA

		const updatedDiff =
			parseItemTimeValue(b, ["updatedAt", "createdAt"]) -
			parseItemTimeValue(a, ["updatedAt", "createdAt"])
		if (updatedDiff !== 0) return updatedDiff

		return byNameAsc(a, b)
	})
}

function setGallerySort(sortValue = "recommended") {
	gallerySortBy = sortValue
	showAllGallery = false
	updateGalleryToggleButtonLabel()
	renderGallery()
}

function renderFeaturedStyles() {
	const trendingList = document.getElementById("trendingBraidsList")
	const mostBookedList = document.getElementById("mostBookedStylesList")
	const trendingHeading = document.getElementById("trendingStylesHeading")
	const mostBookedHeading = document.getElementById("mostBookedStylesHeading")
	if (!trendingList || !mostBookedList) return

	const featuredCategoryLabel = getGalleryFeaturedCategoryLabel(
		galleryFiltersState.service,
	)
	if (trendingHeading) {
		trendingHeading.textContent = `🔥 Trending ${featuredCategoryLabel}`
	}
	if (mostBookedHeading) {
		mostBookedHeading.textContent = `⭐ Most Booked ${featuredCategoryLabel}`
	}

	const source =
		galleryFiltersState.service === "all"
			? galleryData.filter((item) =>
					isServiceCategoryEnabled(item.serviceCategory),
				)
			: galleryData.filter(
					(item) =>
						item.serviceCategory === galleryFiltersState.service &&
						isServiceCategoryEnabled(item.serviceCategory),
				)

	const trending = source.filter((item) => item.featuredTrending).slice(0, 6)
	const mostBooked = source
		.filter((item) => item.featuredMostBooked)
		.slice(0, 6)

	trendingList.innerHTML = trending.length
		? trending
				.map(
					(item) =>
						`<button class="gallery-feature-pill" data-feature-open="${item.id || item.styleName}">${item.styleName}</button>`,
				)
				.join("")
		: `<span class="gallery-feature-empty">No trending ${featuredCategoryLabel.toLowerCase()} yet.</span>`

	mostBookedList.innerHTML = mostBooked.length
		? mostBooked
				.map(
					(item) =>
						`<button class="gallery-feature-pill" data-feature-open="${item.id || item.styleName}">${item.styleName}</button>`,
				)
				.join("")
		: `<span class="gallery-feature-empty">No most booked ${featuredCategoryLabel.toLowerCase()} yet.</span>`
}

function renderGallery() {
	const grid = document.getElementById("galleryGrid")
	const emptyState = document.getElementById("galleryEmptyState")
	const actions = document.getElementById("galleryActions")
	if (!grid) return

	applyGalleryFilters()

	const dataToShow = showAllGallery
		? filteredGalleryData
		: filteredGalleryData.slice(0, 8)

	// Preload before-images for currently visible cards so lightbox opens instantly.
	preloadGalleryBeforeImages(dataToShow)

	if (emptyState) {
		emptyState.style.display = filteredGalleryData.length ? "none" : "block"
	}

	if (actions) {
		actions.style.display = filteredGalleryData.length > 8 ? "block" : "none"
	}
	updateGalleryToggleButtonLabel()

	grid.innerHTML = dataToShow
		.map((item, i) => {
			const hasBeforeAfterPair = Boolean(item.beforeImageUrl && item.imageUrl)
			return `
    <div class="gallery-item" onclick="openLightbox(${i})" style="animation-delay: ${i * 0.1}s">
      ${
				hasBeforeAfterPair
					? `
      <div class="gallery-slideshow" aria-label="${item.styleName} before and after slideshow">
		<img class="gallery-slideshow-image gallery-slideshow-before" src="${item.beforeImageUrl}" alt="${item.styleName} before" loading="lazy" decoding="async" fetchpriority="low">
		<img class="gallery-slideshow-image gallery-slideshow-after" src="${item.imageUrl}" alt="${item.styleName} after" loading="lazy" decoding="async" fetchpriority="low">
      </div>
      `
					: `<img src="${item.imageUrl}" alt="${item.styleName}" loading="lazy" decoding="async" fetchpriority="low">`
			}
      <div class="gallery-overlay">
        <h4>${item.styleName}</h4>
        <p>${item.serviceLabel} • ${item.styleType} • by ${item.stylistName}</p>
        ${hasBeforeAfterPair ? '<span class="before-after">Before & After</span>' : ""}
        <button type="button" class="gallery-save-favorite-btn" data-fav-style-id="${escapeHtml(item.id || "")}" aria-pressed="false">♡ Save</button>
      </div>
    </div>
  `
		})
		.join("")

	initializeGallerySlideshows()
	updateFavoriteButtonsUI()
}

function clearGallerySlideshows() {
	if (!Array.isArray(gallerySlideshowTimers) || !gallerySlideshowTimers.length)
		return
	gallerySlideshowTimers.forEach((timerId) => clearInterval(timerId))
	gallerySlideshowTimers = []
}

function initializeGallerySlideshows() {
	clearGallerySlideshows()

	document.querySelectorAll(".gallery-slideshow").forEach((slideshow) => {
		const beforeImage = slideshow.querySelector(".gallery-slideshow-before")
		const afterImage = slideshow.querySelector(".gallery-slideshow-after")
		if (!beforeImage || !afterImage) return

		let showingAfter = false
		slideshow.classList.remove("is-showing-after")

		const timerId = setInterval(() => {
			showingAfter = !showingAfter
			slideshow.classList.toggle("is-showing-after", showingAfter)
		}, 5000)

		gallerySlideshowTimers.push(timerId)
	})
}

function toggleGalleryView() {
	showAllGallery = !showAllGallery
	renderGallery()
	updateGalleryToggleButtonLabel()
}

function setGalleryFilter(group, value) {
	galleryFiltersState[group] = value

	if (group === "service") {
		resetGallerySubFilters()
	}

	showAllGallery = false
	updateGalleryToggleButtonLabel()
	renderGalleryFilters()
	renderFeaturedStyles()
	renderGallery()
}

function getVisibleGalleryData() {
	return showAllGallery ? filteredGalleryData : filteredGalleryData.slice(0, 8)
}

function isMatchingGalleryItem(item, idOrName) {
	return (item.id && item.id === idOrName) || item.styleName === idOrName
}

function resetGalleryFiltersState() {
	galleryFiltersState.service = "all"
	resetGallerySubFilters()
}

function openGalleryItemByIdOrName(idOrName) {
	let visible = getVisibleGalleryData()
	let index = visible.findIndex((item) => isMatchingGalleryItem(item, idOrName))
	if (index >= 0) {
		openLightbox(index)
		return
	}

	const inFiltered = filteredGalleryData.some((item) =>
		isMatchingGalleryItem(item, idOrName),
	)
	if (inFiltered && !showAllGallery) {
		showAllGallery = true
		renderGallery()
		updateGalleryToggleButtonLabel()

		visible = getVisibleGalleryData()
		index = visible.findIndex((item) => isMatchingGalleryItem(item, idOrName))
		if (index >= 0) {
			openLightbox(index)
			return
		}
	}

	resetGalleryFiltersState()
	showAllGallery = true
	renderGalleryFilters()
	renderGallery()
	updateGalleryToggleButtonLabel()

	visible = getVisibleGalleryData()
	index = visible.findIndex((item) => isMatchingGalleryItem(item, idOrName))
	openLightbox(index >= 0 ? index : 0)
}

function wireGalleryInteractions() {
	const filtersRoot = document.getElementById("galleryFilters")
	if (filtersRoot) {
		filtersRoot.addEventListener("click", (event) => {
			const chip = event.target.closest(".gallery-filter-chip")
			if (!chip) return
			const group = chip.dataset.filterGroup
			const value = chip.dataset.filterValue
			if (!group || typeof value === "undefined") return
			setGalleryFilter(group, value)
		})
	}

	const featuredWrap = document.querySelector(".gallery-featured-wrap")
	if (featuredWrap) {
		featuredWrap.addEventListener("click", (event) => {
			const trigger = event.target.closest("[data-feature-open]")
			if (!trigger) return
			const key = trigger.dataset.featureOpen
			openGalleryItemByIdOrName(key)
		})
	}

	const galleryGrid = document.getElementById("galleryGrid")
	if (galleryGrid) {
		galleryGrid.addEventListener("click", (event) => {
			const favoriteBtn = event.target.closest(".gallery-save-favorite-btn")
			if (!favoriteBtn) return
			event.preventDefault()
			event.stopPropagation()

			const styleId = favoriteBtn.dataset.favStyleId || ""
			const style = galleryData.find(
				(item) => String(item.id || "") === String(styleId),
			)
			if (!style) return

			void toggleFavoriteStyle(style, favoriteBtn)
		})
	}

	const sortSelect = document.getElementById("gallerySortSelect")
	if (sortSelect) {
		sortSelect.value = gallerySortBy
		sortSelect.addEventListener("change", (event) => {
			setGallerySort(event.target.value || "recommended")
		})
	}
}

function startGalleryRealtimeListener() {
	if (!appServicesReady || !db) return

	if (typeof galleryRealtimeUnsubscribe === "function") {
		galleryRealtimeUnsubscribe()
		galleryRealtimeUnsubscribe = null
	}

	galleryRealtimeUnsubscribe = db
		.collection("galleryStyles")
		.limit(300)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) =>
					normalizeGalleryItem({ id: doc.id, ...doc.data() }),
				)
				if (docs.length) {
					galleryData = docs
				} else {
					galleryData = fallbackGalleryData.map((item, i) =>
						normalizeGalleryItem({ id: `fallback-${i}`, ...item }),
					)
				}

				renderGalleryFilters()
				renderFeaturedStyles()
				renderGallery()
			},
			(error) => {
				console.error("Gallery realtime listener failed:", error)
				galleryData = fallbackGalleryData.map((item, i) =>
					normalizeGalleryItem({ id: `fallback-${i}`, ...item }),
				)
				renderGalleryFilters()
				renderFeaturedStyles()
				renderGallery()
			},
		)
}

function normalizeBlogItem(item = {}) {
	return {
		id: String(item.id || "").trim(),
		title:
			String(item.title || item.heading || "Untitled Blog").trim() ||
			"Untitled Blog",
		excerpt: String(item.excerpt || item.description || "").trim(),
		imageUrl: String(item.imageUrl || item.image || "").trim(),
		readMoreUrl:
			String(item.readMoreUrl || item.url || "#blog").trim() || "#blog",
		readTime: String(item.readTime || "5 min read").trim() || "5 min read",
		publishDate: item.publishDate || item.date || "",
		createdAt: item.createdAt || null,
		updatedAt: item.updatedAt || null,
	}
}

function formatBlogDate(value) {
	if (!value) return "N/A"
	const text = String(value).trim()
	if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
		const [year, month, day] = text.split("-").map(Number)
		const date = new Date(year, month - 1, day)
		if (!Number.isNaN(date.getTime())) {
			return date.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		}
	}

	const ms = toTimestampMs(value)
	if (!ms) return text
	return new Date(ms).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	})
}

function getBlogSortTime(item = {}) {
	return (
		toTimestampMs(item.updatedAt) ||
		toTimestampMs(item.createdAt) ||
		toTimestampMs(item.publishDate)
	)
}

function sortBlogsList(items = []) {
	return [...items].sort((a, b) => {
		const timeDiff = getBlogSortTime(b) - getBlogSortTime(a)
		if (timeDiff !== 0) return timeDiff
		return String(a.title || "").localeCompare(
			String(b.title || ""),
			undefined,
			{
				sensitivity: "base",
			},
		)
	})
}

function updateBlogScrollButtons() {
	const grid = document.getElementById("blogGrid")
	const prevBtn = document.getElementById("blogPrevBtn")
	const nextBtn = document.getElementById("blogNextBtn")
	if (!grid || !prevBtn || !nextBtn) return

	const hasMoreBlogsThanDefault =
		Array.isArray(blogsData) && blogsData.length > DEFAULT_VISIBLE_BLOGS
	if (!showAllBlogs && hasMoreBlogsThanDefault) {
		prevBtn.disabled = true
		nextBtn.disabled = false
		return
	}

	const canScroll = grid.scrollWidth - grid.clientWidth > 8
	if (!canScroll) {
		prevBtn.disabled = true
		nextBtn.disabled = true
		return
	}

	prevBtn.disabled = grid.scrollLeft <= 2
	nextBtn.disabled = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 2
}

function scrollBlogCards(direction = "next") {
	const grid = document.getElementById("blogGrid")
	if (!grid) return

	if (
		!showAllBlogs &&
		Array.isArray(blogsData) &&
		blogsData.length > DEFAULT_VISIBLE_BLOGS
	) {
		showAllBlogs = true
		renderBlogs(blogsData)
		requestAnimationFrame(() => scrollBlogCards(direction))
		return
	}

	const firstCard = grid.querySelector(".blog-card")
	if (!firstCard) return

	const style = getComputedStyle(grid)
	const gap = Number.parseFloat(style.columnGap || style.gap || "24") || 24
	const step =
		Math.max(firstCard.offsetWidth, firstCard.getBoundingClientRect().width) +
		gap
	const delta = direction === "prev" ? -step : step
	const maxLeft = Math.max(0, grid.scrollWidth - grid.clientWidth)
	const targetLeft = Math.min(maxLeft, Math.max(0, grid.scrollLeft + delta))

	if (typeof grid.scrollTo === "function") {
		grid.scrollTo({ left: targetLeft, behavior: "smooth" })
	} else {
		grid.scrollLeft = targetLeft
	}

	window.setTimeout(updateBlogScrollButtons, 240)
}

function renderBlogs(list = blogsData) {
	const grid = document.getElementById("blogGrid")
	const viewAllBtn = document.getElementById("viewAllBlogsBtn")
	const viewLessBtn = document.getElementById("viewLessBlogsBtn")
	const toggleControls = document.getElementById("blogToggleControls")
	const scrollControls = document.getElementById("blogScrollControls")
	if (!grid) return

	const sourceItems =
		Array.isArray(list) && list.length
			? list
			: fallbackBlogsData.map((item, i) => ({
					id: `fallback-blog-${i}`,
					...item,
				}))

	const sortedList = sortBlogsList(sourceItems.map(normalizeBlogItem))
	const shouldCollapse = sortedList.length > DEFAULT_VISIBLE_BLOGS
	const visibleList =
		shouldCollapse && !showAllBlogs
			? sortedList.slice(0, DEFAULT_VISIBLE_BLOGS)
			: sortedList

	grid.innerHTML = visibleList
		.map(
			(blog) => `
    <article class="blog-card">
      <div class="blog-card-image">
        <img
          src="${escapeHtml(blog.imageUrl || BLOG_CARD_IMAGE_FALLBACK)}"
          alt="${escapeHtml(blog.title)}"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='true';this.src='${escapeHtml(BLOG_CARD_IMAGE_FALLBACK)}';}"
        />
      </div>
      <div class="blog-card-content">
        <div class="blog-card-meta">
          <span>${escapeHtml(formatBlogDate(blog.publishDate || blog.createdAt))}</span>
          <span>${escapeHtml(blog.readTime || "5 min read")}</span>
        </div>
        <h3>${escapeHtml(blog.title)}</h3>
        <p class="blog-card-excerpt">${escapeHtml(blog.excerpt)}</p>
        <a href="${escapeHtml(blog.readMoreUrl || "#blog")}" class="read-more" target="_blank" rel="noopener">
          Read More
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
      </div>
    </article>
  `,
		)
		.join("")

	if (toggleControls && viewAllBtn && viewLessBtn) {
		if (!shouldCollapse) {
			toggleControls.classList.add("hidden")
			viewAllBtn.classList.add("hidden")
			viewLessBtn.classList.add("hidden")
		} else {
			toggleControls.classList.remove("hidden")
			if (showAllBlogs) {
				viewAllBtn.classList.add("hidden")
				viewLessBtn.classList.remove("hidden")
			} else {
				viewAllBtn.classList.remove("hidden")
				viewLessBtn.classList.add("hidden")
				grid.scrollTo({ left: 0, behavior: "auto" })
			}
		}
	}

	if (scrollControls) {
		scrollControls.classList.toggle("hidden", visibleList.length < 2)
	}

	requestAnimationFrame(() => {
		updateBlogScrollButtons()
	})
}

function bindBlogScrollControls() {
	const grid = document.getElementById("blogGrid")
	const prevBtn = document.getElementById("blogPrevBtn")
	const nextBtn = document.getElementById("blogNextBtn")

	if (prevBtn) {
		prevBtn.addEventListener("click", () => {
			scrollBlogCards("prev")
		})
	}

	if (nextBtn) {
		nextBtn.addEventListener("click", () => {
			scrollBlogCards("next")
		})
	}

	if (grid) {
		grid.addEventListener("scroll", updateBlogScrollButtons, { passive: true })
		window.addEventListener("resize", updateBlogScrollButtons)
	}
}

function bindBlogToggleControls() {
	const viewAllBtn = document.getElementById("viewAllBlogsBtn")
	const viewLessBtn = document.getElementById("viewLessBlogsBtn")

	const animateBlogsToggle = (nextShowAll, scrollToTop = false) => {
		if (showAllBlogs === nextShowAll) return

		const grid = document.getElementById("blogGrid")

		const commitSwitch = () => {
			showAllBlogs = nextShowAll
			renderBlogs(blogsData)
			if (scrollToTop) {
				document
					.getElementById("blog")
					?.scrollIntoView({ behavior: "smooth", block: "start" })
			}
		}

		if (!grid) {
			commitSwitch()
			return
		}

		if (blogsToggleAnimationTimer) {
			clearTimeout(blogsToggleAnimationTimer)
			blogsToggleAnimationTimer = null
		}

		grid.classList.add("is-switching")
		blogsToggleAnimationTimer = setTimeout(() => {
			commitSwitch()
			requestAnimationFrame(() => {
				grid.classList.remove("is-switching")
			})
			blogsToggleAnimationTimer = null
		}, 220)
	}

	if (viewAllBtn) {
		viewAllBtn.addEventListener("click", () => {
			animateBlogsToggle(true)
		})
	}

	if (viewLessBtn) {
		viewLessBtn.addEventListener("click", () => {
			animateBlogsToggle(false, true)
		})
	}
}

function startBlogsRealtimeListener() {
	if (!appServicesReady || !db) return

	if (typeof blogsRealtimeUnsubscribe === "function") {
		blogsRealtimeUnsubscribe()
		blogsRealtimeUnsubscribe = null
	}

	blogsRealtimeUnsubscribe = db
		.collection("blogs")
		.limit(300)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) =>
					normalizeBlogItem({ id: doc.id, ...doc.data() }),
				)

				blogsData = docs.length
					? docs
					: fallbackBlogsData.map((item, i) =>
							normalizeBlogItem({ id: `fallback-blog-${i}`, ...item }),
						)

				renderBlogs(blogsData)
			},
			(error) => {
				console.error("Blogs realtime listener failed:", error)
				blogsData = fallbackBlogsData.map((item, i) =>
					normalizeBlogItem({ id: `fallback-blog-${i}`, ...item }),
				)
				renderBlogs(blogsData)
			},
		)
}

function normalizeReviewItem(item = {}) {
	const name =
		String(item.name || "Anonymous Client").trim() || "Anonymous Client"
	const text = String(item.text || "").trim()
	const ratingRaw = Number(item.rating)
	const rating = Number.isFinite(ratingRaw)
		? Math.max(1, Math.min(5, Math.round(ratingRaw)))
		: 5
	const source = String(item.source || "Website").trim() || "Website"
	const service = String(item.service || "").trim()
	const role = service ? `${service} Client` : item.role || "Verified Client"
	const avatar =
		String(item.avatar || "").trim() ||
		name
			.split(" ")
			.map((part) => part[0])
			.join("")
			.slice(0, 2)
			.toUpperCase()

	return {
		id: item.id || "",
		name,
		avatar,
		role,
		text,
		rating,
		source,
		service,
		photoUrl: String(item.photoUrl || "").trim(),
		adminReply: String(item.adminReply || "").trim(),
		verifiedBooking: item.verifiedBooking === true,
		reportsCount: Number(item.reportsCount || 0),
		featured: item.featured === true,
		status: item.status || "approved",
		createdAt: item.createdAt || null,
	}
}

function getReviewSourceIcon(source = "") {
	if (source === "Instagram") {
		return '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>'
	}
	if (source === "Facebook") {
		return '<path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>'
	}
	if (source === "Google") {
		return '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>'
	}
	return '<path d="M22 12h-4"/><path d="M6 12H2"/><path d="M12 6V2"/><path d="M12 22v-4"/><circle cx="12" cy="12" r="6"/>'
}

function parseReviewTime(value) {
	if (!value) return 0
	if (typeof value?.toMillis === "function") return value.toMillis()
	if (typeof value === "number" && Number.isFinite(value)) return value
	if (value?.seconds && Number.isFinite(value.seconds))
		return value.seconds * 1000
	const parsed = Date.parse(String(value))
	return Number.isNaN(parsed) ? 0 : parsed
}

function sortReviewsList(list = [], mode = reviewsSortMode) {
	const items = [...list]

	if (mode === "newest") {
		return items.sort(
			(a, b) => parseReviewTime(b.createdAt) - parseReviewTime(a.createdAt),
		)
	}

	if (mode === "highest-rated") {
		return items.sort((a, b) => {
			const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0)
			if (ratingDiff !== 0) return ratingDiff
			if (a.featured !== b.featured) return a.featured ? -1 : 1
			return parseReviewTime(b.createdAt) - parseReviewTime(a.createdAt)
		})
	}

	return items.sort((a, b) => {
		if (a.featured !== b.featured) return a.featured ? -1 : 1
		return parseReviewTime(b.createdAt) - parseReviewTime(a.createdAt)
	})
}

function renderReviewsSummary() {
	const summary = document.getElementById("reviewsSummary")
	if (!summary) return

	const total = testimonialsData.length
	if (!total) {
		summary.textContent = "No approved reviews yet."
		return
	}

	const average =
		testimonialsData.reduce(
			(sum, review) => sum + Number(review.rating || 0),
			0,
		) / total
	summary.textContent = `★ ${average.toFixed(1)} average from ${total} review${total === 1 ? "" : "s"}`
}

function markReviewReportedTemporarily(reviewId = "", duration = 2500) {
	const safeReviewId = String(reviewId || "").trim()
	if (!safeReviewId) return

	recentlyReportedReviewIds.add(safeReviewId)

	const activeTimer = reviewReportResetTimers.get(safeReviewId)
	if (activeTimer) {
		clearTimeout(activeTimer)
	}

	renderTestimonials(testimonialsData)

	const timerId = setTimeout(() => {
		recentlyReportedReviewIds.delete(safeReviewId)
		reviewReportResetTimers.delete(safeReviewId)
		renderTestimonials(testimonialsData)
	}, duration)
	reviewReportResetTimers.set(safeReviewId, timerId)
}

function clearTemporaryReportedReview(reviewId = "") {
	const safeReviewId = String(reviewId || "").trim()
	if (!safeReviewId) return

	const activeTimer = reviewReportResetTimers.get(safeReviewId)
	if (activeTimer) {
		clearTimeout(activeTimer)
	}
	recentlyReportedReviewIds.delete(safeReviewId)
	reviewReportResetTimers.delete(safeReviewId)
	renderTestimonials(testimonialsData)
}

function renderTestimonials(list = testimonialsData) {
	const grid = document.getElementById("testimonialsGrid")
	const viewAllBtn = document.getElementById("viewAllReviewsBtn")
	const viewLessBtn = document.getElementById("viewLessReviewsBtn")
	const controls = document.getElementById("reviewsToggleControls")
	if (!grid) return
	const canReportAbuse = isNonGuestSignedIn()
	updateReviewAuthHintVisibility()

	const approvedList =
		Array.isArray(list) && list.length ? list : fallbackTestimonialsData
	const approvedIds = new Set(
		approvedList
			.map((review) => String(review?.id || "").trim())
			.filter(Boolean),
	)
	const pendingDrafts = getReviewDraftsArray()
		.filter((draft) => {
			const draftId = String(draft?.id || "").trim()
			return draftId ? !approvedIds.has(draftId) : true
		})
		.map((draft) =>
			normalizeReviewItem({ ...draft, status: "pending", source: "Website" }),
		)

	// Defensive dedupe by ID in case data from different sources overlaps.
	const dedupedMap = new Map()
	for (const review of [...approvedList, ...pendingDrafts]) {
		const reviewId = String(review?.id || "").trim()
		const dedupeKey = reviewId || `${review.name}__${review.text}`
		if (!dedupedMap.has(dedupeKey)) {
			dedupedMap.set(dedupeKey, review)
		}
	}
	const safeList = Array.from(dedupedMap.values())
	const sortedList = sortReviewsList(safeList)
	const shouldCollapse = sortedList.length > DEFAULT_VISIBLE_REVIEWS
	const visibleList =
		shouldCollapse && !showAllReviews
			? sortedList.slice(0, DEFAULT_VISIBLE_REVIEWS)
			: sortedList

	grid.innerHTML = visibleList
		.map(
			(t) => `
    <div class="testimonial-card">
      <div class="testimonial-stars">
        ${'<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'.repeat(t.rating)}
      </div>
      ${t.service ? `<div class="admin-gallery-tags" style="margin-bottom:8px"><span>${escapeHtml(t.service)}</span></div>` : ""}
      ${t.verifiedBooking ? '<div class="admin-gallery-tags" style="margin-bottom:8px"><span>✅ Verified Booking</span></div>' : ""}
      <p class="testimonial-text">"${t.text}"</p>
	      ${t.photoUrl ? `<div class="testimonial-review-photo-wrap"><img src="${escapeHtml(t.photoUrl)}" alt="Review photo" class="testimonial-review-photo" loading="lazy" decoding="async" fetchpriority="low" /></div>` : ""}
      ${t.adminReply ? `<p class="testimonial-text" style="font-style:normal;border-left:3px solid var(--primary);padding-left:10px"><strong>Admin Reply:</strong> ${escapeHtml(t.adminReply)}</p>` : ""}
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.avatar}</div>
        <div class="testimonial-author-info">
          <h4>${t.name}</h4>
          <span>${t.role}</span>
        </div>
      </div>
	      ${
					t.status === "pending"
						? `<div style="margin-top:10px"><div class="admin-booking-actions"><button class="admin-action-btn" data-review-ui-action="edit" data-review-id="${escapeHtml(t.id)}">Edit Pending</button></div><p style="margin-top:8px;font-size:0.78rem;color:var(--text-muted)">Pending reviews can be edited but not deleted.</p></div>`
						: ""
				}
	      ${
					canReportAbuse
						? `<div class="admin-booking-actions" style="margin-top:10px">
	        <button class="admin-action-btn review-report-btn" data-review-ui-action="report" data-review-id="${escapeHtml(t.id)}">${recentlyReportedReviewIds.has(String(t.id || "").trim()) ? "Reported" : "Report Abuse"}</button>
	      </div>`
						: ""
				}
      <div class="testimonial-social">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${getReviewSourceIcon(t.source)}</svg>
      </div>
    </div>
  `,
		)
		.join("")

	if (controls && viewAllBtn && viewLessBtn) {
		if (!shouldCollapse) {
			controls.classList.add("hidden")
			viewAllBtn.classList.add("hidden")
			viewLessBtn.classList.add("hidden")
		} else {
			controls.classList.remove("hidden")
			if (showAllReviews) {
				viewAllBtn.classList.add("hidden")
				viewLessBtn.classList.remove("hidden")
			} else {
				viewAllBtn.classList.remove("hidden")
				viewLessBtn.classList.add("hidden")
			}
		}
	}

	renderReviewsSummary()
}

function bindReviewToggleControls() {
	const viewAllBtn = document.getElementById("viewAllReviewsBtn")
	const viewLessBtn = document.getElementById("viewLessReviewsBtn")

	const animateReviewsToggle = (nextShowAll, scrollToTop = false) => {
		if (showAllReviews === nextShowAll) return

		const grid = document.getElementById("testimonialsGrid")

		const commitSwitch = () => {
			showAllReviews = nextShowAll
			renderTestimonials(testimonialsData)
			if (scrollToTop) {
				document
					.getElementById("testimonials")
					?.scrollIntoView({ behavior: "smooth", block: "start" })
			}
		}

		if (!grid) {
			commitSwitch()
			return
		}

		if (reviewsToggleAnimationTimer) {
			clearTimeout(reviewsToggleAnimationTimer)
			reviewsToggleAnimationTimer = null
		}

		grid.classList.add("is-switching")
		reviewsToggleAnimationTimer = setTimeout(() => {
			commitSwitch()
			requestAnimationFrame(() => {
				grid.classList.remove("is-switching")
			})
			reviewsToggleAnimationTimer = null
		}, 220)
	}

	if (viewAllBtn) {
		viewAllBtn.addEventListener("click", () => {
			animateReviewsToggle(true)
		})
	}

	if (viewLessBtn) {
		viewLessBtn.addEventListener("click", () => {
			animateReviewsToggle(false, true)
		})
	}
}

function bindReviewsSortControls() {
	const reviewsSortSelect = document.getElementById("reviewsSortSelect")
	if (!reviewsSortSelect) return

	reviewsSortSelect.value = reviewsSortMode
	reviewsSortSelect.addEventListener("change", (event) => {
		reviewsSortMode = event.target.value || "featured"
		showAllReviews = false
		renderTestimonials(testimonialsData)
	})
}

async function submitReview(event) {
	event.preventDefault()

	const form = event.currentTarget
	const submitBtn = form?.querySelector('button[type="submit"]')
	const msg = document.getElementById("reviewMessage")

	if (!form || !submitBtn || !msg) return
	if (!isNonGuestSignedIn()) {
		showTimedFormMessage(msg, "error", "🔐 Please log in to submit a review.")
		openAuthModal("signin")
		return
	}

	const name = document.getElementById("reviewName")?.value?.trim() || ""
	const ratingValue = Number(
		document.getElementById("reviewRating")?.value || 0,
	)
	const service = document.getElementById("reviewService")?.value?.trim() || ""
	const text = document.getElementById("reviewText")?.value?.trim() || ""
	const editId = document.getElementById("reviewEditId")?.value?.trim() || ""
	const photoFile = document.getElementById("reviewPhoto")?.files?.[0] || null

	clearFormMessage(msg)
	msg.classList.remove("is-leaving")
	if (reviewMessageTimer) {
		clearTimeout(reviewMessageTimer)
		reviewMessageTimer = null
	}

	if (
		!name ||
		!text ||
		!Number.isFinite(ratingValue) ||
		ratingValue < 1 ||
		ratingValue > 5
	) {
		showTimedFormMessage(
			msg,
			"error",
			"❌ Please provide your name, rating, and review message.",
		)
		return
	}

	if (text.length < 10) {
		showTimedFormMessage(
			msg,
			"error",
			"❌ Please write at least 10 characters so your feedback is useful.",
		)
		return
	}

	if (name.length < 2 || name.length > 80) {
		showTimedFormMessage(
			msg,
			"error",
			"❌ Name must be between 2 and 80 characters.",
		)
		return
	}

	if (text.length > 800) {
		showTimedFormMessage(
			msg,
			"error",
			"❌ Review message is too long (max 800 characters).",
		)
		return
	}

	if (!appServicesReady || !db || !auth) {
		showTimedFormMessage(
			msg,
			"error",
			"⚠️ Reviews service is not configured yet. Check Supabase/Render settings in client-config.js.",
		)
		return
	}

	setButtonLoadingState(submitBtn, true, {
		loadingText: "Submitting...",
	})

	try {
		const activeUid = auth.currentUser?.uid || null

		if (!activeUid) {
			throw new Error("Please log in to submit your review.")
		}

		let photoUrl = ""
		if (photoFile) {
			photoUrl = await uploadImageToCloudinary(photoFile, {
				purpose: "review-photo",
				tags: ["public_upload", "review_photo"],
				context: { section: "reviews" },
			})
		}

		let verifiedBooking = false
		if (service) {
			try {
				const bookingSnapshot = await db
					.collection("bookings")
					.where("uid", "==", activeUid)
					.where("service", "==", service)
					.where("status", "==", "completed")
					.limit(1)
					.get()
				verifiedBooking = !bookingSnapshot.empty
			} catch (verificationError) {
				console.warn(
					"Verified-booking lookup skipped (permission/index issue):",
					verificationError,
				)
				verifiedBooking = false
			}
		}

		const payload = {
			name,
			avatar: name
				.split(" ")
				.map((part) => part[0])
				.join("")
				.slice(0, 2)
				.toUpperCase(),
			text,
			rating: Math.round(ratingValue),
			source: "Website",
			service,
			photoUrl,
			adminReply: "",
			reportsCount: 0,
			verifiedBooking,
			status: "pending",
			featured: false,
			uid: activeUid,
			createdAt: getServerTimestamp(),
			updatedAt: getServerTimestamp(),
		}

		if (editId) {
			await db.collection("reviews").doc(editId).set(payload, { merge: true })
			saveReviewDraft({
				id: editId,
				name,
				rating: Math.round(ratingValue),
				service,
				text,
				photoUrl,
			})
		} else {
			const created = await db.collection("reviews").add(payload)
			saveReviewDraft({
				id: created.id,
				name,
				rating: Math.round(ratingValue),
				service,
				text,
				photoUrl,
			})
		}

		if (isNonGuestSignedIn()) {
			try {
				await loadUserDashboardData(auth.currentUser)
			} catch (dashboardRefreshError) {
				console.warn(
					"Dashboard refresh after review submit failed:",
					dashboardRefreshError,
				)
			}
		}

		form.reset()
		const reviewEditIdInput = document.getElementById("reviewEditId")
		const cancelEditBtn = document.getElementById("cancelReviewEditBtn")
		const submitReviewBtn = document.getElementById("submitReviewBtn")
		if (reviewEditIdInput) reviewEditIdInput.value = ""
		if (cancelEditBtn) cancelEditBtn.style.display = "none"
		if (submitReviewBtn) submitReviewBtn.textContent = "Submit Review"
		showTimedFormMessage(
			msg,
			"success",
			editId
				? "✅ Review updated and is pending approval."
				: "✅ Thank you! Your review was submitted and is pending approval.",
		)
	} catch (error) {
		console.error("Review submit failed:", error)
		const friendlyError =
			error?.code === "permission-denied"
				? "Permission issue while saving review. Please log in again and retry. If it persists, ask admin to deploy the latest backend policies."
				: error.message || "Failed to submit review. Please try again."
		showTimedFormMessage(msg, "error", `❌ ${friendlyError}`)
	} finally {
		setButtonLoadingState(submitBtn, false, {
			resetText: "Submit Review",
		})
	}
}

function bindReviewForm() {
	const reviewForm = document.getElementById("reviewForm")
	if (!reviewForm) return
	const cancelEditBtn = document.getElementById("cancelReviewEditBtn")
	const submitReviewBtn = document.getElementById("submitReviewBtn")

	reviewForm.addEventListener("input", () => {
		const msg = document.getElementById("reviewMessage")
		if (!msg) return
		if (reviewMessageTimer) {
			clearTimeout(reviewMessageTimer)
			reviewMessageTimer = null
		}
		hideReviewMessage(msg, false)
	})

	reviewForm.addEventListener("submit", (event) => {
		event.preventDefault()
		event.stopPropagation()
		void submitReview(event)
	})

	if (cancelEditBtn) {
		cancelEditBtn.addEventListener("click", () => {
			reviewForm.reset()
			const reviewEditIdInput = document.getElementById("reviewEditId")
			if (reviewEditIdInput) reviewEditIdInput.value = ""
			cancelEditBtn.style.display = "none"
			if (submitReviewBtn) submitReviewBtn.textContent = "Submit Review"
		})
	}

	const grid = document.getElementById("testimonialsGrid")
	if (grid) {
		grid.addEventListener("click", async (event) => {
			const actionBtn = event.target.closest("button[data-review-ui-action]")
			if (!actionBtn) return

			const action = actionBtn.dataset.reviewUiAction
			const reviewId = actionBtn.dataset.reviewId
			if (!action || !reviewId) return

			if (action === "report") {
				if (!db || !auth || !isNonGuestSignedIn()) {
					showTimedReviewMessage("error", "🔐 Log in to report abuse.")
					return
				}

				markReviewReportedTemporarily(reviewId)
				actionBtn.textContent = "Reported"

				try {
					await db
						.collection("reviews")
						.doc(reviewId)
						.set(
							{
								reportsCount: getIncrementValue(1),
								updatedAt: getServerTimestamp(),
							},
							{ merge: true },
						)
					showTimedReviewMessage("success", "✅ Abuse report submitted.")
				} catch (error) {
					clearTemporaryReportedReview(reviewId)
					console.error("Report abuse failed:", error)
					showTimedReviewMessage(
						"error",
						"⚠️ Could not submit abuse report right now.",
					)
				}
				return
			}

			const draft = getReviewDraftsArray().find((item) => item.id === reviewId)
			if (!draft) {
				showTimedReviewMessage(
					"error",
					"⚠️ You can only edit your own local pending draft.",
				)
				return
			}

			if (action === "edit") {
				document.getElementById("reviewEditId").value = draft.id
				document.getElementById("reviewName").value = draft.name || ""
				document.getElementById("reviewRating").value = String(
					draft.rating || 5,
				)
				document.getElementById("reviewService").value = draft.service || ""
				document.getElementById("reviewText").value = draft.text || ""
				if (cancelEditBtn) cancelEditBtn.style.display = "inline-flex"
				if (submitReviewBtn) submitReviewBtn.textContent = "Update Review"
				reviewForm.scrollIntoView({ behavior: "smooth", block: "start" })
			}
		})
	}
}

function populateReviewServiceSelect() {
	const select = document.getElementById("reviewService")
	if (!select) return
	select.innerHTML = '<option value="">Select Service (Optional)</option>'
	getVisibleServicesData().forEach((service) => {
		const option = document.createElement("option")
		option.value = service.name
		option.textContent = service.name
		select.appendChild(option)
	})
}

function startTestimonialsRealtimeListener() {
	if (!appServicesReady || !db) return

	if (typeof testimonialsRealtimeUnsubscribe === "function") {
		testimonialsRealtimeUnsubscribe()
		testimonialsRealtimeUnsubscribe = null
	}

	testimonialsRealtimeUnsubscribe = db
		.collection("reviews")
		.where("status", "==", "approved")
		.limit(120)
		.onSnapshot(
			(snapshot) => {
				const docs = snapshot.docs.map((doc) =>
					normalizeReviewItem({ id: doc.id, ...doc.data() }),
				)

				testimonialsData = docs.length
					? docs
					: fallbackTestimonialsData.map((item, i) =>
							normalizeReviewItem({ id: `fallback-review-${i}`, ...item }),
						)

				renderTestimonials(testimonialsData)
			},
			(error) => {
				console.error("Reviews realtime listener failed:", error)
				testimonialsData = fallbackTestimonialsData.map((item, i) =>
					normalizeReviewItem({ id: `fallback-review-${i}`, ...item }),
				)
				renderTestimonials(testimonialsData)
			},
		)
}

function populateServiceSelect() {
	const select = document.getElementById("serviceSelect")
	if (!select) return
	select
		.querySelectorAll("option[data-dynamic-service='true']")
		.forEach((node) => node.remove())
	const visibleServices = getVisibleServicesData()
	const categories = ["all", ...new Set(visibleServices.map((s) => s.category))]
	categories.forEach((cat) => {
		if (cat === "all") return
		const services = visibleServices.filter((s) => s.category === cat)
		const categoryLabel =
			SERVICE_CATEGORY_LABEL_MAP[cat] ||
			cat.charAt(0).toUpperCase() + cat.slice(1)

		const categoryHeader = document.createElement("option")
		categoryHeader.value = ""
		categoryHeader.textContent = `◆  ${categoryLabel.toUpperCase()}  ◆`
		categoryHeader.disabled = true
		categoryHeader.dataset.dynamicService = "true"
		categoryHeader.dataset.categoryHeader = "true"
		select.appendChild(categoryHeader)

		services.forEach((s) => {
			const opt = document.createElement("option")
			opt.value = s.name
			opt.textContent = `${s.name} (${s.price})`
			opt.dataset.dynamicService = "true"
			select.appendChild(opt)
		})
	})

	const customCategoryHeader = document.createElement("option")
	customCategoryHeader.value = ""
	customCategoryHeader.textContent = "◆  OTHER SERVICES  ◆"
	customCategoryHeader.disabled = true
	customCategoryHeader.dataset.dynamicService = "true"
	customCategoryHeader.dataset.categoryHeader = "true"
	customCategoryHeader.dataset.customCategoryHeader = "true"
	select.appendChild(customCategoryHeader)

	const customOption = document.createElement("option")
	customOption.value = CUSTOM_SERVICE_OPTION_VALUE
	customOption.textContent = "✨ Other Service (Type Yours)"
	customOption.dataset.dynamicService = "true"
	customOption.dataset.customServiceOption = "true"
	select.appendChild(customOption)
}

function toggleCustomServiceInput() {
	const serviceSelect = document.getElementById("serviceSelect")
	const customServiceGroup = document.getElementById("customServiceGroup")
	const customServiceInput = document.getElementById("customServiceInput")
	if (!serviceSelect || !customServiceGroup || !customServiceInput) return

	const isCustom = serviceSelect.value === CUSTOM_SERVICE_OPTION_VALUE
	customServiceGroup.classList.toggle("hidden", !isCustom)
	customServiceInput.required = isCustom

	if (!isCustom) {
		customServiceInput.value = ""
	}
}

function setBookingServiceValue(serviceName = "") {
	const serviceSelect = document.getElementById("serviceSelect")
	const customServiceInput = document.getElementById("customServiceInput")
	if (!serviceSelect) return

	const normalizedService = String(serviceName || "").trim()
	if (!normalizedService) {
		serviceSelect.value = ""
		if (customServiceInput) customServiceInput.value = ""
		toggleCustomServiceInput()
		return
	}

	const hasMatchingOption = Array.from(serviceSelect.options).some(
		(option) => option.value === normalizedService,
	)

	if (hasMatchingOption) {
		serviceSelect.value = normalizedService
		if (customServiceInput) customServiceInput.value = ""
	} else {
		serviceSelect.value = CUSTOM_SERVICE_OPTION_VALUE
		if (customServiceInput) customServiceInput.value = normalizedService
	}

	toggleCustomServiceInput()
}

function initializeCustomServiceInput() {
	const serviceSelect = document.getElementById("serviceSelect")
	if (!serviceSelect) return
	serviceSelect.addEventListener("change", toggleCustomServiceInput)
	toggleCustomServiceInput()
}

function populateTimeSlots() {
	const input = document.getElementById("timeSelect")
	if (!input) return
	renderBookingTimeSlots([])
}

// ============ NAVIGATION & UI ============
const header = document.getElementById("header")
const navToggle = document.getElementById("navToggle")
const nav = document.getElementById("nav")
const backToTop = document.getElementById("backToTop")
const darkModeToggle = document.getElementById("darkModeToggle")

function getHeaderScrollOffset() {
	const headerHeight = header?.offsetHeight || 80
	const rootStyles = getComputedStyle(document.documentElement)
	const scrollGap = parseFloat(
		rootStyles.getPropertyValue("--section-scroll-gap"),
	)
	return headerHeight + (Number.isFinite(scrollGap) ? scrollGap : 12)
}

function getSmoothScrollBehavior(behavior = "smooth") {
	const reduceMotion = window.matchMedia?.(
		"(prefers-reduced-motion: reduce)",
	)?.matches
	return reduceMotion ? "auto" : behavior
}

function scrollToElementWithHeaderOffset(
	element,
	{ behavior = "smooth", block = "start" } = {},
) {
	if (!element) return false

	if (block === "center") {
		element.scrollIntoView({
			behavior: getSmoothScrollBehavior(behavior),
			block,
		})
		return true
	}

	const targetTop =
		window.scrollY +
		element.getBoundingClientRect().top -
		getHeaderScrollOffset()
	window.scrollTo({
		top: Math.max(0, targetTop),
		behavior: getSmoothScrollBehavior(behavior),
	})
	return true
}

function getMainSectionScrollTarget(section) {
	if (!section) return null
	if (section.id === "home") return section
	return (
		section.querySelector(".main-section-heading") ||
		section.querySelector(".section-title") ||
		section
	)
}

function updateHashWithoutNativeJump(hash) {
	if (!hash || hash === "#" || window.location.hash === hash) return
	if (window.history?.pushState) {
		window.history.pushState(null, "", hash)
	}
}

function scrollToMainSection(hash, options = {}) {
	const sectionId = String(hash || "").replace(/^#/, "")
	if (!sectionId) return false
	const section = document.getElementById(sectionId)
	if (!section) return false

	const scrolled = scrollToElementWithHeaderOffset(
		getMainSectionScrollTarget(section),
		options,
	)
	if (scrolled && options.updateHash !== false) {
		updateHashWithoutNativeJump(`#${sectionId}`)
	}
	return scrolled
}

function isBookingActionLink(anchor) {
	return Boolean(
		anchor?.matches?.(".book-btn") ||
		anchor?.closest?.(".hero-buttons") ||
		anchor?.closest?.(".header-actions"),
	)
}

// Sticky header
window.addEventListener("scroll", () => {
	header.classList.toggle("scrolled", window.scrollY > 50)
	backToTop.classList.toggle("visible", window.scrollY > 500)
})

// Mobile nav
navToggle.addEventListener("click", () => {
	navToggle.classList.toggle("active")
	nav.classList.toggle("active")
	document.body.style.overflow = nav.classList.contains("active")
		? "hidden"
		: ""
})
nav.querySelectorAll("a").forEach((a) => {
	a.addEventListener("click", () => {
		navToggle.classList.remove("active")
		nav.classList.remove("active")
		document.body.style.overflow = ""
	})
})

// Active nav on scroll
const sections = document.querySelectorAll("section[id]")
window.addEventListener("scroll", () => {
	const scrollY = window.scrollY + 100
	sections.forEach((s) => {
		const top = s.offsetTop
		const height = s.offsetHeight
		const id = s.getAttribute("id")
		const link = document.querySelector(`.nav a[href="#${id}"]`)
		if (link) {
			if (scrollY >= top && scrollY < top + height) {
				document
					.querySelectorAll(".nav a")
					.forEach((a) => a.classList.remove("active"))
				link.classList.add("active")
			}
		}
	})
})

// ============ DARK MODE ============
function getStoredTheme() {
	try {
		return localStorage.getItem("theme") === "light" ? "light" : "dark"
	} catch (error) {
		return "dark"
	}
}

function storeTheme(theme) {
	try {
		localStorage.setItem("theme", theme)
	} catch (error) {
		// Ignore storage errors so the toggle still responds immediately.
	}
}

let isDark = getStoredTheme() !== "light"
let themeSwitchToken = 0
function applyTheme({ instant = false } = {}) {
	const isLight = !isDark
	const switchToken = instant ? ++themeSwitchToken : themeSwitchToken
	if (instant) {
		document.documentElement.classList.add("theme-switching")
		document.body?.classList.add("theme-switching")
	}

	document.documentElement.classList.toggle("light-mode", isLight)
	document.documentElement.style.colorScheme = isLight ? "light" : "dark"
	document.body?.classList.toggle("light-mode", isLight)
	document.body &&
		(document.body.style.colorScheme = isLight ? "light" : "dark")
	darkModeToggle?.classList.toggle("active", isDark)
	darkModeToggle?.setAttribute("aria-pressed", isDark ? "true" : "false")

	if (instant) {
		const finishThemeSwitch = () => {
			if (switchToken !== themeSwitchToken) return
			document.documentElement.classList.remove("theme-switching")
			document.body?.classList.remove("theme-switching")
		}

		if (typeof requestAnimationFrame === "function") {
			requestAnimationFrame(() => requestAnimationFrame(finishThemeSwitch))
		} else {
			setTimeout(finishThemeSwitch, 0)
		}
	}
}
applyTheme({ instant: true })
applyAccessibilityPrefs(getStoredAccessibilityPrefs())
function toggleThemeInstantly() {
	isDark = !isDark
	storeTheme(isDark ? "dark" : "light")
	applyTheme({ instant: true })
}

darkModeToggle?.addEventListener("click", toggleThemeInstantly)
darkModeToggle?.addEventListener("keydown", (event) => {
	if (event.key !== "Enter" && event.key !== " ") return
	event.preventDefault()
	toggleThemeInstantly()
})

// ============ SCROLL ANIMATIONS ============
const observer = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add("visible")
			}
		})
	},
	{ threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
)

document
	.querySelectorAll(".animate-on-scroll")
	.forEach((el) => observer.observe(el))

// ============ COUNTER ANIMATION ============
function animateCounters() {
	document.querySelectorAll(".hero-stat .number").forEach((el) => {
		const target = parseInt(el.dataset.count)
		const duration = 2000
		const start = performance.now()
		function update(now) {
			const elapsed = now - start
			const progress = Math.min(elapsed / duration, 1)
			const eased = 1 - Math.pow(1 - progress, 3)
			const current = Math.floor(target * eased)
			el.textContent = current.toLocaleString() + (target === 98 ? "%" : "+")
			if (progress < 1) requestAnimationFrame(update)
		}
		requestAnimationFrame(update)
	})
}
const heroObserver = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				animateCounters()
				heroObserver.disconnect()
			}
		})
	},
	{ threshold: 0.3 },
)
document.querySelector(".hero-stats") &&
	heroObserver.observe(document.querySelector(".hero-stats"))

// ============ SERVICES TABS ============
document.querySelectorAll(".services-tab").forEach((tab) => {
	tab.addEventListener("click", () => {
		if (tab.style.display === "none") return
		document
			.querySelectorAll(".services-tab")
			.forEach((t) => t.classList.remove("active"))
		tab.classList.add("active")
		activeServicesFilter = String(tab.dataset.filter || "all")
		renderServices(activeServicesFilter)
	})
})

// ============ BOOKING ============
function focusBookingFormCard({ behavior = "smooth", block = "start" } = {}) {
	const bookingForm = document.getElementById("bookingForm")
	const bookingSection = document.getElementById("booking")
	const bookingSuccess = document.getElementById("bookingSuccess")
	if (!bookingForm && !bookingSection) return

	if (bookingForm && bookingForm.style.display === "none") {
		bookingForm.style.display = "block"
	}
	if (bookingSuccess && bookingSuccess.style.display !== "none") {
		bookingSuccess.style.display = "none"
	}

	const target =
		bookingForm && bookingForm.style.display !== "none"
			? bookingForm
			: bookingSection

	scrollToElementWithHeaderOffset(target, { behavior, block })

	if (target === bookingForm) {
		bookingForm.classList.remove("booking-form--focus-flash")
		// Force reflow so the animation can replay on repeated taps
		void bookingForm.offsetWidth
		bookingForm.classList.add("booking-form--focus-flash")

		setTimeout(() => {
			bookingForm.classList.remove("booking-form--focus-flash")
		}, 1600)
	}
}

function selectService(name) {
	setBookingServiceValue(name)
	focusBookingFormCard({ behavior: "smooth", block: "center" })
	// Update min date to today
	document.getElementById("datePicker").min = new Date()
		.toISOString()
		.split("T")[0]
}

document.getElementById("bookingForm").addEventListener("submit", function (e) {
	e.preventDefault()

	const form = this
	const btn = document.getElementById("submitBtn")
	const msg = document.getElementById("bookingMessage")
	const imageInput = document.getElementById("inspirationImage")

	const data = Object.fromEntries(new FormData(form).entries())
	const customServiceInput = document.getElementById("customServiceInput")
	const customServiceValue = String(customServiceInput?.value || "").trim()
	if (data.service === CUSTOM_SERVICE_OPTION_VALUE) {
		if (!customServiceValue) {
			showTimedFormMessage(
				msg,
				"error",
				"⚠️ Please type the service you would like to book.",
			)
			return
		}
		data.service = customServiceValue
	}

	const pendingWaitlistSelection = getMatchingPendingWaitlistBooking()
	if (pendingWaitlistSelection?.time) {
		data.time = pendingWaitlistSelection.time
	}

	const timeValidation = validateBookingTimeSelection(data.time, {
		allowWaitlisted: Boolean(pendingWaitlistSelection),
	})
	if (!timeValidation.valid) {
		showTimedFormMessage(msg, "error", `⚠️ ${timeValidation.message}`)
		return
	}
	data.time = timeValidation.time
	const timeInput = document.getElementById("timeSelect")
	if (timeInput) timeInput.value = data.time

	const selectedStylistKey = normalizeStylistKey(data.stylist || "any")
	const stylistKey = pendingWaitlistSelection
		? normalizeStylistKey(
				pendingWaitlistSelection.stylistKey || selectedStylistKey,
			)
		: selectedStylistKey
	const slotId = pendingWaitlistSelection
		? ""
		: getSlotId(data.date, stylistKey, data.time)

	clearFormMessage(msg)

	if (!appServicesReady || !db || !auth) {
		showTimedFormMessage(
			msg,
			"error",
			"⚠️ Booking service is not configured yet. Check Supabase/Render settings in client-config.js.",
		)
		return
	}

	setButtonLoadingState(btn, true, {
		loadingText: "Processing...",
	})
	;(async () => {
		try {
			const signedInUser = auth.currentUser && !auth.currentUser.isAnonymous
			let activeUid = signedInUser ? auth.currentUser.uid : null

			if (!activeUid) {
				try {
					const userCredential = await auth.signInAnonymously()
					activeUid = userCredential?.user?.uid || auth.currentUser?.uid || null
				} catch (error) {
					throw new Error(getFriendlyAuthError(error))
				}
			}

			if (!activeUid) {
				throw new Error(
					"Unable to authenticate booking session. Please refresh and try again.",
				)
			}

			let inspirationImageUrl = String(
				pendingWaitlistSelection?.inspirationImageUrl || "",
			).trim()
			const selectedFile = imageInput?.files?.[0]
			if (!inspirationImageUrl && selectedFile) {
				inspirationImageUrl = await uploadImageToCloudinary(selectedFile, {
					purpose: "booking-inspiration",
					tags: ["public_upload", "booking_inspiration"],
					context: { section: "booking", flow: "booking" },
				})
			}

			const bookingRef = db.collection("bookings").doc()

			if (pendingWaitlistSelection) {
				await bookingRef.set({
					firstName: data.firstName || "",
					lastName: data.lastName || "",
					email: String(data.email || "")
						.trim()
						.toLowerCase(),
					phone: data.phone || "",
					service: data.service || "",
					stylist:
						stylistKey === "any" ? "" : getStylistDisplayName(stylistKey),
					stylistKey,
					date: data.date || "",
					time: data.time || "",
					slotId: "",
					preferredSlotId: pendingWaitlistSelection.slotId,
					waitlistId: pendingWaitlistSelection.waitlistId || "",
					bookingType: "waitlist",
					isWaitlisted: true,
					waitlistStatus: "waiting",
					notes: data.notes || "",
					inspirationImageUrl,
					status: "waitlisted",
					uid: activeUid,
					createdAt: getServerTimestamp(),
					updatedAt: getServerTimestamp(),
				})

				form.style.display = "none"
				const bookingSuccess = document.getElementById("bookingSuccess")
				setBookingSuccessContent("waitlisted")
				bookingSuccess.style.display = "block"
				showTimedFormMessage(
					msg,
					"success",
					"✅ Waitlisted booking saved in realtime!",
				)

				bookingSuccess.setAttribute("tabindex", "-1")
				bookingSuccess.scrollIntoView({ behavior: "smooth", block: "center" })
				bookingSuccess.focus({ preventScroll: true })

				setPostBookingPromptVisible(!signedInUser)
				if (signedInUser && activeUid) {
					await upsertUserProfile(auth.currentUser, {
						phone: data.phone || "",
					})
					await loadUserDashboardData(auth.currentUser)
				}

				clearPendingWaitlistBooking()
				handleAvailabilityWatch()
				return
			}

			const slotRef = db.collection("bookingSlots").doc(slotId)
			const existingSlotDoc = await slotRef.get()
			const existingSlotData = existingSlotDoc.exists
				? existingSlotDoc.data() || {}
				: {}
			if (
				existingSlotDoc.exists &&
				existingSlotData.taken === true &&
				isBookingSlotExpired(existingSlotData)
			) {
				await requestExpiredSlotCleanup(slotId, existingSlotData, {
					force: true,
				})
			}

			await db.runTransaction(async (transaction) => {
				const slotDoc = await transaction.get(slotRef)
				if (slotDoc.exists && slotDoc.data().taken) {
					if (isBookingSlotExpired(slotDoc.data() || {})) {
						throw new Error(
							"This appointment time has already passed and is being released. Please select the time again.",
						)
					}
					throw new Error(
						"This time slot was just taken. Please choose another one.",
					)
				}

				transaction.set(slotRef, {
					taken: true,
					date: data.date,
					time: data.time,
					stylistKey,
					bookingId: bookingRef.id,
					uid: activeUid,
					createdAt: getServerTimestamp(),
					updatedAt: getServerTimestamp(),
				})

				transaction.set(bookingRef, {
					firstName: data.firstName || "",
					lastName: data.lastName || "",
					email: String(data.email || "")
						.trim()
						.toLowerCase(),
					phone: data.phone || "",
					service: data.service || "",
					stylist: data.stylist || "",
					stylistKey,
					date: data.date || "",
					time: data.time || "",
					slotId,
					notes: data.notes || "",
					inspirationImageUrl,
					status: "confirmed",
					uid: activeUid,
					createdAt: getServerTimestamp(),
					updatedAt: getServerTimestamp(),
				})
			})

			form.style.display = "none"
			const bookingSuccess = document.getElementById("bookingSuccess")
			setBookingSuccessContent("confirmed")
			bookingSuccess.style.display = "block"
			showTimedFormMessage(
				msg,
				"success",
				"✅ Booking confirmed and saved in realtime!",
			)

			bookingSuccess.setAttribute("tabindex", "-1")
			bookingSuccess.scrollIntoView({ behavior: "smooth", block: "center" })
			bookingSuccess.focus({ preventScroll: true })

			setPostBookingPromptVisible(!signedInUser)
			if (signedInUser && activeUid) {
				await upsertUserProfile(auth.currentUser, {
					phone: data.phone || "",
				})
				await loadUserDashboardData(auth.currentUser)
			}

			handleAvailabilityWatch()
		} catch (error) {
			console.error("Booking failed:", error)

			const shouldOfferWaitlist =
				/time slot was just taken|slot is no longer available/i.test(
					String(error?.message || ""),
				)

			if (shouldOfferWaitlist && activeUid) {
				const wantsWaitlist = window.confirm(
					"That slot is no longer available. Would you like to join the waitlist for this same date, time, and stylist?",
				)

				if (wantsWaitlist) {
					try {
						await joinWaitlistForUnavailableSlot({
							bookingData: data,
							stylistKey,
							activeUid,
							slotId,
							inspirationImageUrl,
						})

						showTimedFormMessage(
							msg,
							"success",
							"✅ You have been added to the waitlist. We’ll notify you if this slot opens up.",
						)
						return
					} catch (waitlistError) {
						console.error("Waitlist join failed:", waitlistError)
						showTimedFormMessage(
							msg,
							"error",
							`❌ Could not join waitlist: ${waitlistError?.message || "Please try again."}`,
						)
						return
					}
				}
			}

			showTimedFormMessage(
				msg,
				"error",
				`❌ ${error.message || "Booking failed. Please try again."}`,
			)
		} finally {
			setButtonLoadingState(btn, false, {
				resetText: "Confirm Booking",
			})
		}
	})()
})

function resetBooking() {
	clearPendingWaitlistBooking()
	document.getElementById("bookingForm").reset()
	setBookingSuccessContent("confirmed")
	populateTimeSlots()
	toggleCustomServiceInput()
	document.getElementById("bookingForm").style.display = "block"
	document.getElementById("bookingSuccess").style.display = "none"
	clearFormMessage(document.getElementById("bookingMessage"))
	setPostBookingPromptVisible(false)
}

// Set min date for booking
const datePicker = document.getElementById("datePicker")
if (datePicker) {
	datePicker.min = new Date().toISOString().split("T")[0]
}

// ============ GALLERY LIGHTBOX ============
const lightbox = document.getElementById("lightbox")
const lightboxImg = document.getElementById("lightboxImg")
const lightboxBeforeAfter = document.getElementById("lightboxBeforeAfter")
const lightboxBeforeImg = document.getElementById("lightboxBeforeImg")
const lightboxAfterImg = document.getElementById("lightboxAfterImg")
const lightboxStyleName = document.getElementById("lightboxStyleName")
const lightboxStyleType = document.getElementById("lightboxStyleType")
const lightboxTimeTaken = document.getElementById("lightboxTimeTaken")
const lightboxPriceRange = document.getElementById("lightboxPriceRange")
const lightboxLength = document.getElementById("lightboxLength")
const lightboxSize = document.getElementById("lightboxSize")
const lightboxHairType = document.getElementById("lightboxHairType")
const lightboxStylist = document.getElementById("lightboxStylist")
const lightboxBookNow = document.getElementById("lightboxBookNow")

function openLightbox(index) {
	const visible = getVisibleGalleryData()
	if (!visible.length || !lightbox) return
	const numericIndex = Number(index)
	if (!Number.isFinite(numericIndex)) return

	currentLightboxIndex = Math.trunc(numericIndex)
	updateLightbox()
	lightbox.classList.add("active")
	document.body.style.overflow = "hidden"
}

function updateLightbox() {
	const visible = getVisibleGalleryData()
	if (!visible.length) return

	const safeIndex =
		((currentLightboxIndex % visible.length) + visible.length) % visible.length
	currentLightboxIndex = safeIndex

	const item = visible[safeIndex]
	if (!item) return

	if (lightboxImg) {
		lightboxImg.src = item.imageUrl || ""
		lightboxImg.alt = item.styleName || "Gallery style"
	}

	if (lightboxStyleName) lightboxStyleName.textContent = item.styleName || "-"
	if (lightboxStyleType) lightboxStyleType.textContent = item.styleType || "-"
	if (lightboxTimeTaken) lightboxTimeTaken.textContent = item.timeTaken || "-"
	if (lightboxPriceRange)
		lightboxPriceRange.textContent = item.priceRange || "On request"
	if (lightboxLength) lightboxLength.textContent = item.length || "-"
	if (lightboxSize) lightboxSize.textContent = item.size || "-"
	if (lightboxHairType) lightboxHairType.textContent = item.hairType || "-"
	if (lightboxStylist) lightboxStylist.textContent = item.stylistName || "-"

	if (lightboxBeforeAfter && lightboxBeforeImg && lightboxAfterImg) {
		if (item.hasBeforeAfter && item.beforeImageUrl) {
			lightboxBeforeAfter.style.display = "grid"
			lightboxBeforeImg.src = item.beforeImageUrl
			lightboxBeforeImg.alt = `${item.styleName} before`
			lightboxAfterImg.src = item.imageUrl || ""
			lightboxAfterImg.alt = `${item.styleName} after`
			if (lightboxImg) lightboxImg.style.display = "none"
		} else {
			lightboxBeforeAfter.style.display = "none"
			if (lightboxImg) lightboxImg.style.display = "block"
		}
	}

	if (lightboxBookNow) {
		lightboxBookNow.onclick = () => {
			setBookingServiceValue(item.styleName || item.styleType || "")
			if (lightbox) lightbox.classList.remove("active")
			document.body.style.overflow = ""
		}
	}

	const lightboxFavoriteBtn = document.getElementById("lightboxFavoriteBtn")
	if (lightboxFavoriteBtn) {
		lightboxFavoriteBtn.dataset.favStyleId = String(item.id || "")
		setFavoriteButtonState(lightboxFavoriteBtn, isStyleFavorited(item))
	}
}

document
	.getElementById("lightboxFavoriteBtn")
	?.addEventListener("click", () => {
		const visible = getVisibleGalleryData()
		if (!visible.length) return
		const safeIndex =
			((currentLightboxIndex % visible.length) + visible.length) %
			visible.length
		const item = visible[safeIndex]
		if (!item) return
		const lightboxFavoriteBtn = document.getElementById("lightboxFavoriteBtn")
		void toggleFavoriteStyle(item, lightboxFavoriteBtn)
	})

document.getElementById("lightboxClose")?.addEventListener("click", () => {
	if (lightbox) lightbox.classList.remove("active")
	document.body.style.overflow = ""
})

document.getElementById("lightboxPrev")?.addEventListener("click", () => {
	const visible = getVisibleGalleryData()
	if (!visible.length) return
	currentLightboxIndex =
		(currentLightboxIndex - 1 + visible.length) % visible.length
	updateLightbox()
})

document.getElementById("lightboxNext")?.addEventListener("click", () => {
	const visible = getVisibleGalleryData()
	if (!visible.length) return
	currentLightboxIndex = (currentLightboxIndex + 1) % visible.length
	updateLightbox()
})

lightbox?.addEventListener("click", (e) => {
	if (e.target === lightbox) {
		lightbox.classList.remove("active")
		document.body.style.overflow = ""
	}
})

document.addEventListener("keydown", (e) => {
	if (
		e.key === "Escape" &&
		authUi.manageAccountModal?.classList.contains("active")
	) {
		closeManageAccountModal()
		return
	}

	if (!lightbox || !lightbox.classList.contains("active")) return

	const visible = getVisibleGalleryData()
	if (!visible.length) return

	if (e.key === "Escape") {
		lightbox.classList.remove("active")
		document.body.style.overflow = ""
	}
	if (e.key === "ArrowLeft") {
		currentLightboxIndex =
			(currentLightboxIndex - 1 + visible.length) % visible.length
		updateLightbox()
	}
	if (e.key === "ArrowRight") {
		currentLightboxIndex = (currentLightboxIndex + 1) % visible.length
		updateLightbox()
	}
})

// ============ CONTACT FORM ============
document
	.getElementById("contactForm")
	?.addEventListener("submit", async function (e) {
		e.preventDefault()

		const form = this
		const submitBtn = this.querySelector('button[type="submit"]')
		const msg = document.getElementById("contactFormMessage")

		if (submitBtn) {
			setButtonLoadingState(submitBtn, true, {
				loadingText: "Sending...",
			})
		}

		if (msg) clearFormMessage(msg)

		try {
			if (!appServicesReady || !db || !auth) {
				throw new Error(
					"Contact service is not ready yet. Please wait a moment and try again.",
				)
			}

			let activeUid = auth.currentUser?.uid || null
			if (!activeUid) {
				try {
					const userCredential = await auth.signInAnonymously()
					activeUid = userCredential?.user?.uid || auth.currentUser?.uid || null
				} catch (authError) {
					throw new Error(getFriendlyAuthError(authError))
				}
			}

			if (!activeUid) {
				throw new Error(
					"Unable to authenticate contact session. Please refresh and try again.",
				)
			}

			const payload = {
				name: String(
					document.getElementById("contactName")?.value || "",
				).trim(),
				email: String(
					document.getElementById("contactEmail")?.value || "",
				).trim(),
				subject: String(
					document.getElementById("contactSubject")?.value || "",
				).trim(),
				message: String(
					document.getElementById("contactMessage")?.value || "",
				).trim(),
				status: "new",
				uid: activeUid,
				createdAt: getServerTimestamp(),
				updatedAt: getServerTimestamp(),
			}

			if (
				!payload.name ||
				!payload.email ||
				!payload.subject ||
				!payload.message
			) {
				throw new Error("Please fill in all contact fields before sending.")
			}

			await db.collection("contactMessages").add(payload)

			form.reset()
			if (msg) clearFormMessage(msg)
			showContactSuccessPopup()
		} catch (error) {
			console.error("Contact form submit failed:", error)
			const friendlyMessage =
				error?.code === "permission-denied"
					? "Please wait a minute before sending another message."
					: error.message || "Failed to send message. Please try again."
			if (msg) {
				showTimedFormMessage(msg, "error", `❌ ${friendlyMessage}`)
			}
		} finally {
			if (submitBtn) {
				setButtonLoadingState(submitBtn, false, {
					resetText: "Send Message",
				})
			}
		}
	})

const contactSuccessPopup = document.getElementById("contactSuccessPopup")
const contactSuccessPopupClose = document.getElementById(
	"contactSuccessPopupClose",
)
let contactPopupTimeout

function hideContactSuccessPopup() {
	if (!contactSuccessPopup) return
	contactSuccessPopup.classList.remove("show")
	if (contactPopupTimeout) {
		clearTimeout(contactPopupTimeout)
		contactPopupTimeout = null
	}
}

function showContactSuccessPopup() {
	if (!contactSuccessPopup) return
	if (contactPopupTimeout) {
		clearTimeout(contactPopupTimeout)
	}
	contactSuccessPopup.classList.remove("show")
	// Force a reflow so repeated successful submissions restart the timer bar
	// without creating duplicate/stacked success messages.
	void contactSuccessPopup.offsetWidth
	contactSuccessPopup.classList.add("show")
	contactPopupTimeout = setTimeout(() => {
		hideContactSuccessPopup()
	}, 5000)
}

if (contactSuccessPopupClose) {
	contactSuccessPopupClose.addEventListener("click", hideContactSuccessPopup)
}

// ============ SMOOTH SCROLL FOR ALL ANCHOR LINKS ============
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
	anchor.addEventListener("click", function (e) {
		const href = this.getAttribute("href")
		if (!href || href === "#") return

		if (href === "#booking" && isBookingActionLink(this)) {
			e.preventDefault()
			updateHashWithoutNativeJump(href)
			focusBookingFormCard({ behavior: "smooth", block: "start" })
			return
		}

		if (scrollToMainSection(href, { behavior: "smooth" })) {
			e.preventDefault()
		}
	})
})

window.addEventListener("load", () => {
	if (!window.location.hash) return
	requestAnimationFrame(() => {
		scrollToMainSection(window.location.hash, {
			behavior: "auto",
			updateHash: false,
		})
	})
})

// ============ RE-OBSERVE DYNAMICALLY ADDED ELEMENTS ============
const mutationObserver = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		mutation.addedNodes.forEach((node) => {
			if (node.nodeType === 1) {
				const animated = node.querySelectorAll(".animate-on-scroll")
				animated.forEach((el) => observer.observe(el))
			}
		})
	})
})
mutationObserver.observe(document.body, { childList: true, subtree: true })

// ============ HEADER LOGO SIMPLE ROTATION ============
const DEFAULT_HEADER_LOGO_IMAGES = [
	"IMG/logo.png",
	"IMG/logo 1.png",
	"IMG/logo 2.jpg",
	"IMG/logo 3.png",
	"IMG/logo 4.png",
	"IMG/logo 5.png",
	"IMG/logo 6.jpg",
]

function normalizeHeaderLogoImageSource(item = "") {
	const rawValue =
		typeof item === "object" && item !== null
			? item.src || item.url || item.imageUrl || item.path || item.href || ""
			: item
	return String(rawValue || "").trim()
}

function getConfiguredHeaderLogoImages(currentSrc = "") {
	const configuredSources = []
	const configuredLists = [
		clientConfig?.brand?.logoImages,
		clientConfig?.media?.logoImages,
		clientConfig?.brand?.logos,
		clientConfig?.media?.logos,
	]

	configuredLists.forEach((list) => {
		if (Array.isArray(list)) {
			configuredSources.push(...list)
		} else if (typeof list === "string") {
			configuredSources.push(list)
		}
	})

	const primaryLogoSource = normalizeHeaderLogoImageSource(
		clientConfig?.brand?.logoSrc || clientConfig?.media?.logoSrc || currentSrc,
	)
	const sourceList = configuredSources.length
		? [primaryLogoSource, ...configuredSources]
		: [primaryLogoSource, ...DEFAULT_HEADER_LOGO_IMAGES]
	const seenSources = new Set()

	return sourceList
		.map((item) => normalizeHeaderLogoImageSource(item))
		.filter((src) => {
			if (!src || seenSources.has(src)) return false
			seenSources.add(src)
			return true
		})
}

function initAnimatedHeaderLogo() {
	const logoImage = document.getElementById("logoCubeImage")
	if (!logoImage) return

	const logoImages = getConfiguredHeaderLogoImages(
		logoImage.getAttribute("src") || logoImage.currentSrc || "",
	)
	if (!logoImages.length) return

	let imageIndex = 0
	const swapIntervalMs = 3500

	logoImage.decoding = "async"
	logoImage.loading = "eager"
	logoImage.src = logoImages[imageIndex]
	if (logoImages.length < 2) return

	logoImages.slice(1).forEach((src) => {
		const preload = new Image()
		preload.decoding = "async"
		preload.src = src
	})

	const rotateHeaderLogo = () => {
		imageIndex = (imageIndex + 1) % logoImages.length
		const nextLogo = logoImages[imageIndex]
		if (nextLogo && logoImage.getAttribute("src") !== nextLogo) {
			logoImage.src = nextLogo
		}
	}

	window.setInterval(rotateHeaderLogo, swapIntervalMs)
}

// ============ INITIALIZE ============
initAuthUiRefs()
setAuthMode("signin")
setDashboardPromptState()
bindAuthUiEvents()
bindSessionPresenceLifecycle()
renderServices()
syncServicesTabsVisibility()
galleryData = fallbackGalleryData.map((item, i) =>
	normalizeGalleryItem({ id: `fallback-${i}`, ...item }),
)
renderGalleryFilters()
renderFeaturedStyles()
renderGallery()
wireGalleryInteractions()
blogsData = fallbackBlogsData.map((item, i) =>
	normalizeBlogItem({ id: `fallback-blog-${i}`, ...item }),
)
renderBlogs(blogsData)
bindBlogScrollControls()
bindBlogToggleControls()
document
	.getElementById("viewAllGallery")
	?.addEventListener("click", toggleGalleryView)
renderTestimonials(testimonialsData.map((item) => normalizeReviewItem(item)))
bindReviewsSortControls()
bindReviewToggleControls()
bindReviewForm()
updateReviewSubmissionVisibility()
populateReviewServiceSelect()
populateServiceSelect()
initializeCustomServiceInput()
populateTimeSlots()
bindBookingTimePickerControls()
bindWaitlistControls()
initAnimatedHeaderLogo()

// Initialize booking integrations
initializeAppServices().then(async () => {
	await handleGoogleRedirectResultOnLoad()

	const stylistSelect = document.getElementById("stylistSelect")
	const dateInput = document.getElementById("datePicker")

	if (stylistSelect) {
		stylistSelect.addEventListener(
			"change",
			handleBookingAvailabilityInputChange,
		)
	}
	if (dateInput) {
		dateInput.addEventListener("change", handleBookingAvailabilityInputChange)
	}

	startGalleryRealtimeListener()
	startBlogsRealtimeListener()
	startTestimonialsRealtimeListener()
})
