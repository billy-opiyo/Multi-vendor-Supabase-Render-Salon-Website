// Complete white-label client configuration.
// ------------------------------------------------------------
// For a new client, edit this file instead of hunting through HTML/JS.
// Safe to expose here: branding, contact details, public social links,
// public Firebase/Supabase/Render config during the migration, and public
// Cloudinary folder name. Never put private API secrets here. Resend,
// WhatsApp, Cloudinary, and Supabase service-role secrets belong in server
// environment variables; see MIGRATION_SUPABASE_RENDER.md.
// ------------------------------------------------------------
;(function () {
	const firebaseConfig = {
		apiKey: "AIzaSyAyVcRjG55o6nwaXpRzZyt2BtX2RamGEqg",
		authDomain: "services-website-billydev.firebaseapp.com",
		projectId: "services-website-billydev",
		storageBucket: "services-website-billydev.firebasestorage.app",
		messagingSenderId: "712913782427",
		appId: "1:712913782427:web:e997553d71bd9a1f6a283e",
		measurementId: "G-B6LVQBEN3G",
	}
	const supabaseConfig = {
		// Public values only. Replace after creating the new Supabase project.
		// Never place SUPABASE_SERVICE_ROLE_KEY in frontend code.
		url: "https://YOUR_SUPABASE_PROJECT_REF.supabase.co",
		anonKey: "YOUR_SUPABASE_ANON_KEY",
	}
	const renderBackendUrl = ""

	const businessName = "Royal Braids"
	const businessSlug = "royal-braids"
	const businessShortNameHtml = "ROYAL<br />BRAIDS"
	const businessLogoTextHtml = "👑 ROYAL BRAIDS"
	const country = "Kenya"
	const city = "Nairobi"
	const timezone = "Africa/Nairobi"
	const locale = "en-KE"
	const currency = "KES"
	const currentYear = new Date().getFullYear()

	const phonePrimary = "+254 700 123 456"
	const phonePrimaryHref = "tel:+254700123456"
	const phoneSecondary = "+254 711 987 654"
	const phoneSecondaryHref = "tel:+254711987654"
	const whatsappUrl = "https://wa.me/254700123456"
	const emailPrimary = "info@royalbraids.ke"
	const emailBookings = "bookings@royalbraids.ke"
	const contactNotificationEmail = "billyopiyo597@gmail.com"
	const cloudinaryGalleryFolder = `${businessSlug}/gallery`
	const brandLogoImages = [
		"IMG/logo.png",
		"IMG/logo 1.png",
		"IMG/logo 2.jpg",
		"IMG/logo 3.png",
		"IMG/logo 4.png",
		"IMG/logo 5.png",
		"IMG/logo 6.jpg",
	]
	const appearance = {
		// `mode` is only the client default. A visitor's saved light/dark choice
		// in localStorage still wins when present.
		mode: "dark",
		// Available presets in CSS: gold, champagne, rose-gold, emerald,
		// plum-gold, terracotta, teal, blush, lavender.
		preset: "gold",
	}
	const themeOverrides = {
		// Optional exact brand overrides for clients with specific color values.
		// Leave empty to use the selected `appearance.preset` palette.
		// primary: "#C8963E",
		// primaryDark: "#A6792D",
		// primaryLight: "#E8C27A",
		// accentPurple: "#6B2E7A",
		// accentPink: "#B84E7A",
	}

	// Client-editable service catalog.
	// Update these arrays for each salon instead of editing HTML or app JS.
	//
	// Nested sub-services example:
	// Add `subServices` directly to any service when a service has variants.
	// The frontend already reads `service.subServices` as an array of objects
	// using the same fields as a normal service: name, desc, price, duration.
	//
	// {
	// 	name: "Box Braids",
	// 	desc: "Classic sectioned braids for a neat, long-lasting protective style.",
	// 	price: "From KSh 3,500",
	// 	duration: "3-5 hrs",
	// 	icon: "scissors",
	// 	category: "braids-services",
	// 	categoryLabel: "Braids Services",
	// 	subServices: [
	// 		{
	// 			name: "Medium Box Braids",
	// 			desc: "Balanced size box braids for everyday wear.",
	// 			price: "From KSh 3,500",
	// 			duration: "3-5 hrs",
	// 		},
	// 	],
	// }
	//
	// For this template, the complete default sub-service set is kept in
	// `serviceSubServicesByServiceName` below and merged into the exported
	// catalog so every final `service` has `service.subServices` populated.
	const serviceCategories = [
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

	const stylists = [
		{ key: "fatima", name: "Fatima Hassan", title: "Master Braider" },
		{ key: "zainab", name: "Zainab Mohamed", title: "Senior Stylist" },
		{ key: "grace", name: "Grace Wanjiku", title: "Natural Hair Expert" },
		{ key: "amina", name: "Amina Diallo", title: "Braiding Specialist" },
		{ key: "sarah", name: "Sarah Omondi", title: "Kids Specialist" },
	]

	const services = [
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

	const serviceSubServicesByServiceName = {
		"Hair Braiding": [
			{
				name: "Classic Individual Braids",
				desc: "Neat individual braids using your preferred parting size.",
				price: "From KSh 3,000",
				duration: "2-4 hrs",
			},
			{
				name: "Protective Plaiting",
				desc: "Simple protective braiding for natural hair care and low manipulation.",
				price: "From KSh 2,500",
				duration: "2-3 hrs",
			},
			{
				name: "Braiding with Extensions",
				desc: "Protective braids finished with added extension length and fullness.",
				price: "From KSh 3,800",
				duration: "3-5 hrs",
			},
		],
		"Box Braids": [
			{
				name: "Medium Box Braids",
				desc: "Balanced size box braids for everyday wear.",
				price: "From KSh 3,500",
				duration: "3-5 hrs",
			},
			{
				name: "Small Box Braids",
				desc: "Smaller parting for a fuller, longer-lasting box braid finish.",
				price: "From KSh 5,000",
				duration: "5-7 hrs",
			},
			{
				name: "Jumbo Box Braids",
				desc: "Bold large-section box braids with a quicker installation time.",
				price: "From KSh 3,000",
				duration: "2-3 hrs",
			},
			{
				name: "Box Braids Retouch",
				desc: "Hairline and parting refresh to extend your box braid style.",
				price: "From KSh 1,500",
				duration: "1-2 hrs",
			},
		],
		"Knotless Braids": [
			{
				name: "Medium Knotless Braids",
				desc: "Lightweight knotless braids with medium-size parting.",
				price: "From KSh 4,500",
				duration: "4-6 hrs",
			},
			{
				name: "Small Knotless Braids",
				desc: "Detailed small knotless braids for extra fullness and longevity.",
				price: "From KSh 6,500",
				duration: "6-8 hrs",
			},
			{
				name: "Boho Knotless Braids",
				desc: "Knotless braids with curly bohemian pieces for a soft finish.",
				price: "From KSh 6,000",
				duration: "5-7 hrs",
			},
			{
				name: "Knotless Braids Retouch",
				desc: "Front and perimeter refresh for existing knotless braids.",
				price: "From KSh 2,000",
				duration: "1.5-2.5 hrs",
			},
		],
		Cornrows: [
			{
				name: "Straight Back Cornrows",
				desc: "Classic straight-back cornrows for a clean protective style.",
				price: "From KSh 1,500",
				duration: "1-2 hrs",
			},
			{
				name: "Feed-In Cornrows",
				desc: "Natural-looking cornrows with gradual extension feed-in.",
				price: "From KSh 2,500",
				duration: "2-3 hrs",
			},
			{
				name: "Design Cornrows",
				desc: "Custom patterned cornrows with curves, parts, or creative styling.",
				price: "From KSh 2,800",
				duration: "2-4 hrs",
			},
			{
				name: "Kids Cornrows",
				desc: "Gentle child-friendly cornrows with simple or playful patterns.",
				price: "From KSh 1,200",
				duration: "1-2 hrs",
			},
		],
		"Fulani Braids": [
			{
				name: "Classic Fulani Braids",
				desc: "Traditional Fulani-inspired braids with center and side details.",
				price: "From KSh 4,000",
				duration: "3-5 hrs",
			},
			{
				name: "Fulani Braids with Beads",
				desc: "Fulani braids finished with bead accents and styling details.",
				price: "From KSh 4,500",
				duration: "4-5 hrs",
			},
			{
				name: "Boho Fulani Braids",
				desc: "Fulani braids blended with curly bohemian strands.",
				price: "From KSh 5,500",
				duration: "4-6 hrs",
			},
		],
		"Stitch Braids": [
			{
				name: "6-8 Stitch Braids",
				desc: "Crisp stitch braids in a classic 6 to 8 braid layout.",
				price: "From KSh 2,500",
				duration: "2-3 hrs",
			},
			{
				name: "Freestyle Stitch Braids",
				desc: "Custom stitch braid patterns with creative parting and detail.",
				price: "From KSh 3,500",
				duration: "3-4 hrs",
			},
			{
				name: "Stitch Braid Ponytail",
				desc: "Feed-in stitch braids styled into a sleek ponytail finish.",
				price: "From KSh 3,800",
				duration: "3-4 hrs",
			},
		],
		"Faux Locs": [
			{
				name: "Shoulder-Length Faux Locs",
				desc: "Lightweight loc-inspired style finished around shoulder length.",
				price: "From KSh 4,500",
				duration: "4-6 hrs",
			},
			{
				name: "Long Faux Locs",
				desc: "Long faux locs with natural movement and protective coverage.",
				price: "From KSh 6,000",
				duration: "6-8 hrs",
			},
			{
				name: "Goddess Faux Locs",
				desc: "Faux locs with curly goddess pieces for a textured finish.",
				price: "From KSh 6,500",
				duration: "6-8 hrs",
			},
			{
				name: "Faux Locs Retouch",
				desc: "Root refresh and touch-up for existing faux locs.",
				price: "From KSh 2,500",
				duration: "2-3 hrs",
			},
		],
		"Hair Styling": [
			{
				name: "Sleek Ponytail",
				desc: "Smooth ponytail styling with a polished salon finish.",
				price: "From KSh 1,800",
				duration: "60-90 mins",
			},
			{
				name: "Curls & Waves Styling",
				desc: "Soft curls, waves, or volume styling for everyday or events.",
				price: "From KSh 1,500",
				duration: "45-75 mins",
			},
			{
				name: "Updo Styling",
				desc: "Elegant pinned updo styling for formal occasions.",
				price: "From KSh 2,500",
				duration: "75-120 mins",
			},
		],
		"Hair Cutting": [
			{
				name: "Trim & Shape",
				desc: "Healthy ends trim and shape maintenance.",
				price: "From KSh 1,200",
				duration: "30-45 mins",
			},
			{
				name: "Layered Cut",
				desc: "Layered haircut for movement, shape, and volume.",
				price: "From KSh 1,800",
				duration: "45-60 mins",
			},
			{
				name: "Big Chop / Restyle",
				desc: "Major restyle or big chop with shaping consultation.",
				price: "From KSh 2,500",
				duration: "60-90 mins",
			},
		],
		"Hair Coloring": [
			{
				name: "Root Touch-Up",
				desc: "Color refresh for new growth and visible roots.",
				price: "From KSh 3,500",
				duration: "1.5-2 hrs",
			},
			{
				name: "Full Color",
				desc: "Single-process full color application and finish.",
				price: "From KSh 5,000",
				duration: "2-3 hrs",
			},
			{
				name: "Highlights / Balayage",
				desc: "Dimensional color placement for brightness and contrast.",
				price: "From KSh 7,500",
				duration: "3-5 hrs",
			},
			{
				name: "Toner / Gloss",
				desc: "Tone correction or shine gloss for refreshed color.",
				price: "From KSh 2,500",
				duration: "45-75 mins",
			},
		],
		"Hair Relaxing": [
			{
				name: "Virgin Relaxer",
				desc: "First-time full relaxer application with careful scalp protection.",
				price: "From KSh 3,500",
				duration: "2-2.5 hrs",
			},
			{
				name: "Relaxer Retouch",
				desc: "New-growth relaxer retouch for previously relaxed hair.",
				price: "From KSh 2,800",
				duration: "1.5-2 hrs",
			},
			{
				name: "Relaxer + Treatment",
				desc: "Relaxer service finished with strengthening moisture care.",
				price: "From KSh 4,200",
				duration: "2-3 hrs",
			},
		],
		"Hair Treatment": [
			{
				name: "Deep Conditioning Treatment",
				desc: "Moisture-rich conditioning for softness and manageability.",
				price: "From KSh 2,000",
				duration: "60 mins",
			},
			{
				name: "Protein Treatment",
				desc: "Strengthening treatment for weak, brittle, or damaged hair.",
				price: "From KSh 2,500",
				duration: "60-90 mins",
			},
			{
				name: "Scalp Treatment",
				desc: "Scalp-focused cleanse and care for dryness or buildup.",
				price: "From KSh 2,200",
				duration: "60 mins",
			},
			{
				name: "Hydration Steam Treatment",
				desc: "Steam-assisted moisture treatment for deeper product absorption.",
				price: "From KSh 2,800",
				duration: "75-90 mins",
			},
		],
		"Wig Installation": [
			{
				name: "Lace Frontal Install",
				desc: "Secure frontal wig installation with natural hairline blending.",
				price: "From KSh 4,000",
				duration: "2-3 hrs",
			},
			{
				name: "Closure Wig Install",
				desc: "Closure wig install with clean parting and secure placement.",
				price: "From KSh 3,000",
				duration: "1.5-2.5 hrs",
			},
			{
				name: "Wig Revamp & Styling",
				desc: "Wash, refresh, and style an existing wig unit.",
				price: "From KSh 2,500",
				duration: "1.5-2 hrs",
			},
		],
		"Weaving/Extensions": [
			{
				name: "Sew-In Weave",
				desc: "Classic sew-in installation for volume, length, and protection.",
				price: "From KSh 3,500",
				duration: "2-4 hrs",
			},
			{
				name: "Leave-Out Weave",
				desc: "Natural leave-out weave installation with smooth blending.",
				price: "From KSh 4,000",
				duration: "2.5-4 hrs",
			},
			{
				name: "Extensions Install",
				desc: "Extension installation customized by hair type and desired finish.",
				price: "From KSh 4,500",
				duration: "2-4 hrs",
			},
			{
				name: "Weave Maintenance",
				desc: "Tightening, refresh, and styling for an existing weave.",
				price: "From KSh 2,000",
				duration: "1-2 hrs",
			},
		],
		"Hair Washing & Blow Dry": [
			{
				name: "Wash & Blow Dry",
				desc: "Cleanse, condition, and smooth blow-dry finish.",
				price: "From KSh 1,500",
				duration: "45-75 mins",
			},
			{
				name: "Wash + Silk Press",
				desc: "Wash, blow-dry, and silk press for a sleek finish.",
				price: "From KSh 3,000",
				duration: "1.5-2 hrs",
			},
			{
				name: "Wash + Treatment Add-On",
				desc: "Wash and blow dry paired with moisture or repair treatment.",
				price: "From KSh 2,500",
				duration: "75-120 mins",
			},
		],
		Facials: [
			{
				name: "Classic Facial",
				desc: "Cleanse, exfoliation, mask, and hydration for refreshed skin.",
				price: "From KSh 2,500",
				duration: "60 mins",
			},
			{
				name: "Deep Cleansing Facial",
				desc: "Purifying facial with extractions and congestion care.",
				price: "From KSh 3,500",
				duration: "75 mins",
			},
			{
				name: "Hydrating Facial",
				desc: "Moisture-focused facial for dry, dull, or dehydrated skin.",
				price: "From KSh 3,000",
				duration: "60 mins",
			},
			{
				name: "Anti-Aging Facial",
				desc: "Firming and glow-focused facial for mature or tired skin.",
				price: "From KSh 4,000",
				duration: "75 mins",
			},
		],
		"Body Scrubs": [
			{
				name: "Sugar / Salt Body Scrub",
				desc: "Full-body exfoliation using a smoothing sugar or salt blend.",
				price: "From KSh 3,000",
				duration: "60 mins",
			},
			{
				name: "Coffee Body Scrub",
				desc: "Energizing scrub to polish and revive tired-looking skin.",
				price: "From KSh 3,200",
				duration: "60 mins",
			},
			{
				name: "Scrub + Moisture Seal",
				desc: "Exfoliation finished with nourishing body butter or oil.",
				price: "From KSh 3,800",
				duration: "75 mins",
			},
		],
		"Steam Therapy": [
			{
				name: "Facial Steam Therapy",
				desc: "Gentle facial steam to open pores before treatment.",
				price: "From KSh 2,000",
				duration: "30 mins",
			},
			{
				name: "Hair Steam Therapy",
				desc: "Hydrating hair steam session for treatment absorption.",
				price: "From KSh 2,500",
				duration: "45 mins",
			},
			{
				name: "Body Steam Therapy",
				desc: "Relaxing body steam session for pores and tension release.",
				price: "From KSh 2,800",
				duration: "45 mins",
			},
		],
		"Skin Treatments": [
			{
				name: "Hyperpigmentation Treatment",
				desc: "Targeted treatment for uneven tone and dark spots.",
				price: "From KSh 4,000",
				duration: "75 mins",
			},
			{
				name: "Sensitive Skin Calming Treatment",
				desc: "Soothing care for reactive, dry, or irritated skin.",
				price: "From KSh 3,500",
				duration: "60 mins",
			},
			{
				name: "Anti-Aging Renewal Treatment",
				desc: "Renewal-focused treatment for texture, firmness, and glow.",
				price: "From KSh 4,500",
				duration: "75-90 mins",
			},
		],
		Sauna: [
			{
				name: "Single Sauna Session",
				desc: "Solo sauna session for relaxation and wellness.",
				price: "From KSh 2,000",
				duration: "30-45 mins",
			},
			{
				name: "Couples Sauna Session",
				desc: "Private sauna session for two guests.",
				price: "From KSh 3,500",
				duration: "45 mins",
			},
			{
				name: "Sauna + Shower Refresh",
				desc: "Sauna therapy followed by a fresh shower reset.",
				price: "From KSh 2,500",
				duration: "45-60 mins",
			},
		],
		"Body Polishing": [
			{
				name: "Full Body Polish",
				desc: "Complete body polish for smoother texture and glow.",
				price: "From KSh 3,800",
				duration: "75 mins",
			},
			{
				name: "Back Polish",
				desc: "Focused polish for the back and shoulder area.",
				price: "From KSh 2,500",
				duration: "45 mins",
			},
			{
				name: "Hands & Feet Polish",
				desc: "Brightening polish for hands, feet, elbows, and knees.",
				price: "From KSh 2,000",
				duration: "45 mins",
			},
		],
		"Acne Treatment": [
			{
				name: "Acne Clarifying Facial",
				desc: "Clarifying facial to calm congestion and reduce breakouts.",
				price: "From KSh 3,200",
				duration: "60 mins",
			},
			{
				name: "Back Acne Treatment",
				desc: "Targeted cleanse and treatment for back breakouts.",
				price: "From KSh 4,000",
				duration: "60 mins",
			},
			{
				name: "Acne Follow-Up Care",
				desc: "Follow-up session for ongoing acne management.",
				price: "From KSh 2,500",
				duration: "45 mins",
			},
		],
		"Skin Brightening": [
			{
				name: "Brightening Facial",
				desc: "Tone-evening facial to enhance natural radiance.",
				price: "From KSh 3,500",
				duration: "60 mins",
			},
			{
				name: "Underarm Brightening",
				desc: "Focused underarm treatment for smoother, brighter-looking skin.",
				price: "From KSh 2,500",
				duration: "45 mins",
			},
			{
				name: "Body Brightening Treatment",
				desc: "Body-focused tone-evening treatment for glow and smoothness.",
				price: "From KSh 5,500",
				duration: "90 mins",
			},
		],
		Manicure: [
			{
				name: "Classic Manicure",
				desc: "Nail shaping, cuticle care, buffing, and polish.",
				price: "From KSh 1,200",
				duration: "45 mins",
			},
			{
				name: "Spa Manicure",
				desc: "Classic manicure with scrub, massage, and hydration.",
				price: "From KSh 1,800",
				duration: "60 mins",
			},
			{
				name: "French Manicure",
				desc: "Clean French-tip manicure with a polished natural look.",
				price: "From KSh 1,700",
				duration: "60 mins",
			},
		],
		Pedicure: [
			{
				name: "Classic Pedicure",
				desc: "Foot soak, nail grooming, cuticle care, and polish.",
				price: "From KSh 1,500",
				duration: "60 mins",
			},
			{
				name: "Spa Pedicure",
				desc: "Classic pedicure with scrub, mask, massage, and hydration.",
				price: "From KSh 2,200",
				duration: "75 mins",
			},
			{
				name: "Callus Care Pedicure",
				desc: "Focused smoothing for dry heels and rough foot areas.",
				price: "From KSh 2,500",
				duration: "75-90 mins",
			},
		],
		"Gel Polish": [
			{
				name: "Hands Gel Polish",
				desc: "Long-wear gel polish application on natural nails.",
				price: "From KSh 1,800",
				duration: "45-60 mins",
			},
			{
				name: "Toes Gel Polish",
				desc: "Durable gel polish finish for toenails.",
				price: "From KSh 1,800",
				duration: "45-60 mins",
			},
			{
				name: "Gel Removal + Reapplication",
				desc: "Safe gel removal followed by a fresh gel polish set.",
				price: "From KSh 2,300",
				duration: "60-75 mins",
			},
		],
		"Acrylic Nails": [
			{
				name: "Acrylic Full Set",
				desc: "Custom acrylic extensions shaped to your desired length.",
				price: "From KSh 2,500",
				duration: "75-90 mins",
			},
			{
				name: "Acrylic Overlay",
				desc: "Acrylic overlay on natural nails for added strength.",
				price: "From KSh 2,000",
				duration: "60-75 mins",
			},
			{
				name: "Acrylic Refill",
				desc: "Acrylic fill-in for regrowth and shape refresh.",
				price: "From KSh 1,800",
				duration: "60 mins",
			},
		],
		"Nail Art": [
			{
				name: "Simple Nail Art",
				desc: "Minimal accents, lines, dots, or feature-nail designs.",
				price: "From KSh 2,000",
				duration: "60 mins",
			},
			{
				name: "Detailed Nail Art",
				desc: "Custom hand-painted designs or detailed themed art.",
				price: "From KSh 2,800",
				duration: "75-90 mins",
			},
			{
				name: "Rhinestones / Chrome Art",
				desc: "Sparkle, chrome, gems, or textured nail art accents.",
				price: "From KSh 2,500",
				duration: "60-90 mins",
			},
		],
		"Nail Repair": [
			{
				name: "Single Nail Repair",
				desc: "Repair one broken, chipped, or lifted nail.",
				price: "From KSh 800",
				duration: "30 mins",
			},
			{
				name: "Acrylic Repair",
				desc: "Fix cracked or lifted acrylic nails and restore shape.",
				price: "From KSh 1,000",
				duration: "30-45 mins",
			},
			{
				name: "Gel Repair",
				desc: "Touch up chipped gel polish or repair gel finish.",
				price: "From KSh 800",
				duration: "30-45 mins",
			},
		],
		"Bridal Makeup": [
			{
				name: "Bridal Makeup Trial",
				desc: "Pre-wedding makeup trial to refine your bridal look.",
				price: "From KSh 5,000",
				duration: "1.5-2 hrs",
			},
			{
				name: "Wedding Day Bridal Makeup",
				desc: "Premium long-wear bridal makeup for the wedding day.",
				price: "From KSh 8,000",
				duration: "2-3 hrs",
			},
			{
				name: "Bridal Touch-Up Kit",
				desc: "Touch-up essentials prepared for the bride after application.",
				price: "From KSh 2,500",
				duration: "Add-on",
			},
		],
		"Party Makeup": [
			{
				name: "Soft Glam Makeup",
				desc: "Elegant soft glam for dinners, parties, and celebrations.",
				price: "From KSh 3,500",
				duration: "75-90 mins",
			},
			{
				name: "Full Glam Makeup",
				desc: "Bold event-ready makeup with sculpted complexion and eyes.",
				price: "From KSh 4,500",
				duration: "90 mins",
			},
			{
				name: "Glitter Glam Makeup",
				desc: "Party makeup with shimmer, glitter, or dramatic eye detail.",
				price: "From KSh 5,000",
				duration: "90-120 mins",
			},
		],
		"Photoshoot Makeup": [
			{
				name: "Studio Glam Makeup",
				desc: "Camera-ready makeup balanced for studio lighting.",
				price: "From KSh 4,500",
				duration: "90-120 mins",
			},
			{
				name: "Editorial Glam Makeup",
				desc: "Creative, bold, or concept-driven makeup for shoots.",
				price: "From KSh 6,000",
				duration: "2 hrs",
			},
			{
				name: "Outdoor Long-Wear Makeup",
				desc: "Durable makeup prepared for outdoor heat and movement.",
				price: "From KSh 5,000",
				duration: "90 mins",
			},
		],
		"Everyday Makeup": [
			{
				name: "Natural Beat",
				desc: "Fresh, minimal makeup that enhances natural features.",
				price: "From KSh 2,500",
				duration: "45-60 mins",
			},
			{
				name: "Office Makeup",
				desc: "Clean professional makeup for work or meetings.",
				price: "From KSh 2,800",
				duration: "60 mins",
			},
			{
				name: "Fresh-Face Glow",
				desc: "Light glowing makeup for casual outings and daytime events.",
				price: "From KSh 3,000",
				duration: "60 mins",
			},
		],
		"Eyelash Installation": [
			{
				name: "Strip Lash Application",
				desc: "Quick strip lash fitting to complete your makeup look.",
				price: "From KSh 1,800",
				duration: "30-45 mins",
			},
			{
				name: "Individual Cluster Lashes",
				desc: "Cluster lash application for a fuller, customized effect.",
				price: "From KSh 2,500",
				duration: "45-60 mins",
			},
			{
				name: "Volume Strip Upgrade",
				desc: "Dramatic volume strip lashes added to makeup or lash service.",
				price: "From KSh 2,200",
				duration: "30-45 mins",
			},
		],
		Haircuts: [
			{
				name: "Classic Haircut",
				desc: "Clean classic cut tailored to your preferred style.",
				price: "From KSh 800",
				duration: "30-45 mins",
			},
			{
				name: "Skin Fade",
				desc: "Sharp skin fade with smooth blending and finishing.",
				price: "From KSh 1,000",
				duration: "40-50 mins",
			},
			{
				name: "Scissor Cut",
				desc: "Precision scissor cut for longer styles and shape control.",
				price: "From KSh 1,200",
				duration: "45-60 mins",
			},
		],
		"Beard Grooming": [
			{
				name: "Beard Trim",
				desc: "Tidy beard trim to maintain length and shape.",
				price: "From KSh 700",
				duration: "20-30 mins",
			},
			{
				name: "Beard Shape-Up",
				desc: "Defined beard lines and shaping for a sharper finish.",
				price: "From KSh 900",
				duration: "30 mins",
			},
			{
				name: "Hot Towel Shave",
				desc: "Relaxing hot towel shave with clean blade finish.",
				price: "From KSh 1,200",
				duration: "30-45 mins",
			},
		],
		"Hair Dye": [
			{
				name: "Black Dye / Grey Coverage",
				desc: "Natural dark dye or grey coverage for a clean refresh.",
				price: "From KSh 1,500",
				duration: "45-60 mins",
			},
			{
				name: "Color Tint",
				desc: "Subtle color tint customized to your haircut and style.",
				price: "From KSh 2,000",
				duration: "60 mins",
			},
			{
				name: "Beard Dye",
				desc: "Beard color enhancement or grey blending.",
				price: "From KSh 1,000",
				duration: "30-45 mins",
			},
		],
		"Kids Haircuts": [
			{
				name: "Basic Kids Haircut",
				desc: "Simple child-friendly haircut with a calm grooming approach.",
				price: "From KSh 600",
				duration: "20-30 mins",
			},
			{
				name: "Kids Fade",
				desc: "Neat fade haircut for boys and young clients.",
				price: "From KSh 800",
				duration: "30 mins",
			},
			{
				name: "Kids Design Cut",
				desc: "Kids haircut with a simple line or design detail.",
				price: "From KSh 1,000",
				duration: "30-40 mins",
			},
		],
		"Lineups/Fades": [
			{
				name: "Lineup",
				desc: "Sharp hairline and edges clean-up.",
				price: "From KSh 900",
				duration: "30 mins",
			},
			{
				name: "Taper Fade",
				desc: "Clean taper fade around the neckline and sides.",
				price: "From KSh 1,000",
				duration: "30-40 mins",
			},
			{
				name: "Burst / Skin Fade",
				desc: "Detailed fade service with sharp blending and finishing.",
				price: "From KSh 1,200",
				duration: "40-50 mins",
			},
		],
		"Full Body Massage": [
			{
				name: "Swedish Massage",
				desc: "Relaxing full-body massage with gentle to medium pressure.",
				price: "From KSh 4,000",
				duration: "60 mins",
			},
			{
				name: "Aromatherapy Massage",
				desc: "Full-body massage enhanced with calming aroma oils.",
				price: "From KSh 4,500",
				duration: "60-90 mins",
			},
			{
				name: "Couples Full Body Massage",
				desc: "Relaxing massage experience for two guests.",
				price: "From KSh 8,000",
				duration: "60-90 mins",
			},
		],
		"Deep Tissue Massage": [
			{
				name: "Deep Tissue 60 Minutes",
				desc: "Focused deep pressure massage for tight muscles.",
				price: "From KSh 4,500",
				duration: "60 mins",
			},
			{
				name: "Deep Tissue 90 Minutes",
				desc: "Extended deep tissue session for full-body muscle relief.",
				price: "From KSh 6,000",
				duration: "90 mins",
			},
			{
				name: "Sports Focus Massage",
				desc: "Targeted muscle work for active bodies and recovery support.",
				price: "From KSh 5,000",
				duration: "60-75 mins",
			},
		],
		"Hot Stone Massage": [
			{
				name: "Back & Shoulder Hot Stone",
				desc: "Warm stone therapy focused on upper body tension.",
				price: "From KSh 3,500",
				duration: "45 mins",
			},
			{
				name: "Full Body Hot Stone",
				desc: "Full-body hot stone massage for deep relaxation.",
				price: "From KSh 5,000",
				duration: "75-90 mins",
			},
			{
				name: "Hot Stone + Aromatherapy",
				desc: "Warm stone massage paired with calming aroma oils.",
				price: "From KSh 5,800",
				duration: "90 mins",
			},
		],
		"Neck & Shoulder Massage": [
			{
				name: "Neck & Shoulder 30 Minutes",
				desc: "Quick upper-body massage for stiffness and tension.",
				price: "From KSh 2,500",
				duration: "30 mins",
			},
			{
				name: "Neck & Shoulder 45 Minutes",
				desc: "Extended upper-body relief for neck, shoulders, and upper back.",
				price: "From KSh 3,200",
				duration: "45 mins",
			},
			{
				name: "Desk-Stress Relief",
				desc: "Focused massage for posture tension from desk work.",
				price: "From KSh 3,000",
				duration: "40 mins",
			},
		],
		"Eyebrow Shaping": [
			{
				name: "Eyebrow Threading",
				desc: "Precise brow shaping using threading technique.",
				price: "From KSh 900",
				duration: "20-30 mins",
			},
			{
				name: "Waxing / Tweezing Shape",
				desc: "Brow shaping with wax, tweezing, or a blended method.",
				price: "From KSh 1,000",
				duration: "20-30 mins",
			},
			{
				name: "Brow Mapping",
				desc: "Measured brow mapping and shape design for symmetry.",
				price: "From KSh 1,300",
				duration: "30 mins",
			},
		],
		"Eyebrow Tinting": [
			{
				name: "Standard Brow Tint",
				desc: "Tint application for naturally fuller-looking brows.",
				price: "From KSh 1,200",
				duration: "20-30 mins",
			},
			{
				name: "Henna Brow Tint",
				desc: "Longer-lasting henna tint for richer brow definition.",
				price: "From KSh 1,800",
				duration: "45 mins",
			},
			{
				name: "Brow Tint + Shape",
				desc: "Brow shaping paired with custom tint application.",
				price: "From KSh 2,000",
				duration: "45 mins",
			},
		],
		"Eyelash Extension": [
			{
				name: "Classic Lash Set",
				desc: "Natural one-to-one lash extension set.",
				price: "From KSh 2,800",
				duration: "90-120 mins",
			},
			{
				name: "Hybrid Lash Set",
				desc: "Blend of classic and volume lashes for soft fullness.",
				price: "From KSh 3,800",
				duration: "2 hrs",
			},
			{
				name: "Volume Lash Set",
				desc: "Fuller volume lash extension set for a dramatic look.",
				price: "From KSh 4,500",
				duration: "2-2.5 hrs",
			},
			{
				name: "Lash Fill",
				desc: "Extension fill to refresh retention and fullness.",
				price: "From KSh 2,000",
				duration: "60-90 mins",
			},
		],
		"Lash Lift": [
			{
				name: "Lash Lift Only",
				desc: "Lift and curl natural lashes without tint.",
				price: "From KSh 2,200",
				duration: "45-60 mins",
			},
			{
				name: "Lash Lift + Tint",
				desc: "Lift and darken natural lashes for extra definition.",
				price: "From KSh 2,800",
				duration: "60 mins",
			},
			{
				name: "Keratin Lash Lift",
				desc: "Lash lift finished with nourishing keratin care.",
				price: "From KSh 3,200",
				duration: "60 mins",
			},
		],
		"Bridal Hair + Makeup": [
			{
				name: "Bridal Hair + Makeup Trial",
				desc: "Trial session for both bridal hair and makeup direction.",
				price: "From KSh 8,000",
				duration: "2-3 hrs",
			},
			{
				name: "Wedding Day Bride",
				desc: "Complete wedding-day hair and makeup for the bride.",
				price: "From KSh 12,000",
				duration: "3-4 hrs",
			},
			{
				name: "Bridal Touch-Up / Change",
				desc: "Reception touch-up or look change for the bride.",
				price: "From KSh 5,000",
				duration: "1-2 hrs",
			},
		],
		"Wedding Beauty Packages": [
			{
				name: "Bride + Maid of Honor",
				desc: "Beauty package for the bride and maid of honor.",
				price: "From KSh 20,000",
				duration: "Half day",
			},
			{
				name: "Bridal Party 3-5",
				desc: "Coordinated hair and makeup for a small bridal party.",
				price: "From KSh 35,000",
				duration: "Half day",
			},
			{
				name: "Full Bridal Team",
				desc: "Custom package for larger bridal teams and schedules.",
				price: "From KSh 55,000",
				duration: "Full day",
			},
		],
		"Graduation Package": [
			{
				name: "Hair Styling + Makeup",
				desc: "Graduation-ready hair styling and makeup bundle.",
				price: "From KSh 7,500",
				duration: "2-3 hrs",
			},
			{
				name: "Graduation Makeup Only",
				desc: "Photo-ready makeup for graduation day.",
				price: "From KSh 4,000",
				duration: "75-90 mins",
			},
			{
				name: "Graduation Glam + Lashes",
				desc: "Graduation makeup finished with lashes for extra definition.",
				price: "From KSh 5,000",
				duration: "90 mins",
			},
		],
		"Photoshoot Package": [
			{
				name: "Hair + Makeup Photoshoot Package",
				desc: "Complete styling package for studio or outdoor shoots.",
				price: "From KSh 8,500",
				duration: "2-3 hrs",
			},
			{
				name: "Photoshoot Makeup Only",
				desc: "Camera-ready makeup service for a photo session.",
				price: "From KSh 4,500",
				duration: "90-120 mins",
			},
			{
				name: "Half-Day On-Set Touch-Up",
				desc: "On-set touch-up support for half-day photo sessions.",
				price: "From KSh 10,000",
				duration: "Half day",
			},
		],
	}

	const servicesWithSubServices = services.map((service) => {
		const configuredSubServices = Array.isArray(service.subServices)
			? service.subServices
			: serviceSubServicesByServiceName[service.name] || []

		return {
			...service,
			subServices: configuredSubServices,
		}
	})

	window.CLIENT_CONFIG = {
		client: {
			name: businessName,
			slug: businessSlug,
			country,
			city,
			timezone,
			locale,
			currency,
		},

		brand: {
			businessName,
			adminTitle: `${businessName} Admin`,
			shortNameHtml: businessShortNameHtml,
			footerLogoHtml: businessLogoTextHtml,
			logoSrc: brandLogoImages[0],
			logoImages: brandLogoImages,
			favicon: "IMG/Royal Braids logo.png",
			logoAlt: `${businessName} rotating logo`,
			heroImage: "IMG/1000_F_595420115_RZi6MAsq90qVRMfFz37ZKBianocAltUu.jpg",
			heroImageAlt: "African Hair Braiding Salon",
			heroSubtitle: "Premium African Hair Braiding & Beauty",
			heroTitleHtml: "Celebrate Your Crown with <span>Beautiful Braids</span>",
			heroDescription:
				"From signature braids, hair services and flawless twists to glowing beauty spa rituals, precision nails, radiant makeup, barber grooming, eyebrows & lash enhancements, and bridal-ready glam—step into a full beauty experience crafted to make you shine.",
			footerDescription:
				"Nairobi’s premier beauty destination for braids and beyond—offering expert hair styling, spa indulgence, nail artistry, makeup, barber grooming, lash enhancement, wellness care, and unforgettable bridal/event transformations.",
			copyright: `© ${currentYear} ${businessName}. All rights reserved.`,
			craftedBy: `Crafted with ❤️ in ${city}, ${country}`,
		},

		seo: {
			title: `${businessName} | Premium African Hair Braiding Salon`,
			description:
				"Premium African Hair Braiding & Salon in Nairobi offering luxury braiding, and hair treatments. Book online today.",
			keywords:
				"Saloonist Nairobi, Salon Westlands, Braids Twists Kenya, Royal Braids",
			ogTitle: `${businessName} | Premium African Hair Braiding & Salon`,
			ogImage: "IMG/logo.png",
		},

		contact: {
			phonePrimary,
			phonePrimaryHref,
			phoneSecondary,
			phoneSecondaryHref,
			emailPrimary,
			emailPrimaryHref: `mailto:${emailPrimary}`,
			emailBookings,
			emailBookingsHref: `mailto:${emailBookings}`,
			notificationEmail: contactNotificationEmail,
			formSubject: `New Contact Message - ${businessName}`,
			locationShort: "Westlands, Nairobi",
			addressHtml:
				"Westlands Shopping Centre, 2nd Floor<br />Waiyaki Way, Nairobi, Kenya",
			mapEmbedUrl:
				"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8199!2d36.8075!3d-1.2644!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f17390b2f4643%3A0x4b25b087296c88f7!2sWestlands%2C+Nairobi!5e0!3m2!1sen!2ske!4v1",
			weekdayHours: "8:00 AM - 8:00 PM",
			saturdayHours: "9:00 AM - 7:00 PM",
			sundayHours: "10:00 AM - 5:00 PM",
			publicHolidayHours: "10:00 AM - 4:00 PM",
			footerWeekdayHours: "Mon-Fri: 8AM - 8PM",
			footerWeekendHours: "Sat-Sun: 9AM - 7PM",
		},

		social: {
			instagram: "https://www.instagram.com",
			facebook: "https://www.facebook.com",
			twitter: "https://x.com",
			tiktok: "https://www.tiktok.com",
			whatsapp: whatsappUrl,
		},

		appearance,
		themePreset: appearance.preset,
		theme: themeOverrides,

		media: {
			logoSrc: brandLogoImages[0],
			logoImages: brandLogoImages,
			favicon: "IMG/Royal Braids logo.png",
			heroImage: "IMG/1000_F_595420115_RZi6MAsq90qVRMfFz37ZKBianocAltUu.jpg",
			galleryFolder: cloudinaryGalleryFolder,
		},

		catalog: {
			serviceCategories,
			services: servicesWithSubServices,
			stylists,
			anyStylistLabel: "Any Available",
			customServiceLabel: "✨ Other Service (Type Yours)",
		},

		integrations: {
			firebase: firebaseConfig,
			supabase: supabaseConfig,
			renderBackendUrl,
			migrationTarget: {
				database: "supabase",
				backend: "render",
				status: "scaffold",
			},
			cloudinaryFolder: cloudinaryGalleryFolder,
			whatsappPublicUrl: whatsappUrl,
			contactEmailProvider: "firebase-functions-resend",
			nextContactEmailProvider: "render-api-resend",
			firebaseSecretNames: {
				resendApiKey: "RESEND_API_KEY",
				resendFromEmail: "RESEND_FROM_EMAIL",
				whatsappAccessToken: "WHATSAPP_CLOUD_ACCESS_TOKEN",
				whatsappPhoneNumberId: "WHATSAPP_CLOUD_PHONE_NUMBER_ID",
				cloudinaryCloudName: "CLOUDINARY_CLOUD_NAME",
				cloudinaryApiKey: "CLOUDINARY_API_KEY",
				cloudinaryApiSecret: "CLOUDINARY_API_SECRET",
			},
		},

		features: {
			bookingEnabled: true,
			reviewsEnabled: true,
			blogEnabled: true,
			galleryEnabled: true,
			waitlistEnabled: true,
			whatsappNotificationsEnabled: true,
			emailNotificationsEnabled: true,
		},

		app: {
			firebase: firebaseConfig,
			supabase: supabaseConfig,
			renderBackendUrl,
			cloudinaryFolder: cloudinaryGalleryFolder,
			businessName,
			businessSlug,
			timezone,
			locale,
			currency,
		},
	}

	// Existing app/admin scripts already read APP_CONFIG, so keep this bridge.
	window.APP_CONFIG = window.CLIENT_CONFIG.app
})()
