export type FAQCategory = "booking" | "pricing" | "road-test" | "general" | "classes" | "policy" | "requirements";

export type FAQItem = {
    id: string;
    category: FAQCategory;
    question: string;
    answer_short: string;
    answer_long?: string;
    keywords: string[];
    synonyms?: string[];
    links?: { text: string; url: string }[];
    priority: number; // 1-10, higher = more important
    fallback_for?: FAQCategory[]; // categories this can serve as fallback for
};

export const FAQ_DATA: FAQItem[] = [
    // --- PRICING (HIGH PRIORITY) ---
    {
        id: "pricing-drivers-ed",
        category: "pricing",
        question: "How much is Driver's Education?",
        answer_short: "Our 36-hour Driver's Education course starts at **$390** for Morning/Evening classes and **$450** for Weekend classes.",
        answer_long: "The full Driver's Education program includes 30 hours of classroom instruction and 6 hours of behind-the-wheel training. Morning and Evening sessions run for 2 weeks, while Weekend classes span 5 weeks. All materials and certification are included.",
        keywords: ["driver's ed price", "drivers ed price", "driving school cost", "36 hour class", "theory class", "drivers education cost", "how much", "de price", "390", "450"],
        synonyms: ["driver ed", "DE", "classroom course", "drivers ed tuition", "how much is drivers ed"],
        links: [{ text: "View Packages", url: "/services/drivers-education-packages" }],
        priority: 10,
        fallback_for: ["pricing"]
    },
    {
        id: "pricing-private-lessons",
        category: "pricing",
        question: "How much is driving practice?",
        answer_short: "Driving practice starts at **$65/hour**. We also offer **2-Hour sessions** and a **10-Hour Package** with discounted rates.",
        answer_long: "Our practice sessions are perfect for building confidence and skills. The 10-Hour Package includes 5 sessions of 2 hours each, giving you comprehensive practice at a better value with one-on-one instruction.",
        keywords: ["driving lesson price", "practice pricing", "driving practice cost", "hourly rate", "behind the wheel cost", "BTW price", "1 hour lesson", "2 hour lesson", "10 hour package", "practice package price"],
        synonyms: ["practice sessions", "driving practice", "BTW", "private lesson price", "how much is a lesson"],
        links: [{ text: "View Practice Packages", url: "/services/driving-practice-packages" }],
        priority: 9
    },
    {
        id: "pricing-road-test",
        category: "pricing",
        question: "How much is the Road Test service?",
        answer_short: "Road Test Escort starts at **$120** in Silver Spring. This includes the car, insurance, and a certified instructor.",
        answer_long: "We provide an MVA-compliant vehicle with insurance documentation, handle all paperwork, and our certified instructor accompanies you to the test site. Bethesda location pricing may vary.",
        keywords: ["road test price", "car rental cost", "mva escort", "test day car", "license test cost", "escort price", "road test package price", "120", "200", "265"],
        synonyms: ["driving test", "license exam", "road exam price", "mva test price"],
        links: [{ text: "View Road Test Info", url: "/services/road-test-packages" }],
        priority: 9
    },
    {
        id: "pricing-packages-comparison",
        category: "pricing",
        question: "What packages do you offer?",
        answer_short: "We offer **Driver's Education** ($390-$450), **Driving Practice** ($65-$650), and **Road Test Escort** ($120+).",
        answer_long: "Choose the package that fits your needs: Complete Driver's Ed for new drivers, flexible practice sessions for skill building, or Road Test Escort for test day support. Many students combine packages for a complete learning journey.",
        keywords: ["packages", "what do you offer", "services", "options", "plans"],
        links: [
            { text: "Driver's Ed", url: "/services/drivers-education-packages" },
            { text: "Practice", url: "/services/driving-practice-packages" },
            { text: "Road Test", url: "/services/road-test-packages" }
        ],
        priority: 8,
        fallback_for: ["pricing", "general"]
    },

    // --- BOOKING ---
    {
        id: "how-to-book",
        category: "booking",
        question: "How do I book a lesson or class?",
        answer_short: "Book online in 3 steps: **Choose your package** → **Select date & time** → **Pay securely** to confirm.",
        answer_long: "Our online booking system is available 24/7. Select your desired service, pick from available slots, and complete payment with credit/debit card. You'll receive instant confirmation via email with all details.",
        keywords: ["how to book", "schedule", "sign up", "register", "enroll", "reserve", "book now", "book class", "book lesson", "how do i enroll"],
        synonyms: ["make appointment", "schedule lesson", "checkout", "online booking", "registration steps"],
        links: [
            { text: "Book Now", url: "/services/drivers-education-packages" },
            { text: "Student Login", url: "/student/login" }
        ],
        priority: 10,
        fallback_for: ["booking"]
    },
    {
        id: "booking-availability",
        category: "booking",
        question: "How soon can I book? What's your availability?",
        answer_short: "Availability varies by service and location. Check our online calendar for real-time slots, or call **(301) 755-6986** for urgent bookings.",
        keywords: ["availability", "how soon", "when can I book", "next available", "schedule", "open slots", "earliest slot", "today availability", "tomorrow availability"],
        synonyms: ["next appointment", "nearest opening", "book this week"],
        links: [{ text: "View Calendar", url: "/services/driving-practice-packages" }],
        priority: 8
    },
    {
        id: "booking-what-payment",
        category: "booking",
        question: "What payment methods do you accept?",
        answer_short: "We accept **credit/debit cards** online. For in-person payments, please call ahead to confirm options.",
        keywords: ["payment", "how to pay", "credit card", "debit", "cash", "payment methods"],
        priority: 6
    },

    // --- POLICY (RESCHEDULE/CANCEL/REFUND) ---
    {
        id: "reschedule-policy",
        category: "policy",
        question: "How do I reschedule or cancel?",
        answer_short: "Reschedule or cancel **24 hours in advance** through your student portal to avoid fees.",
        answer_long: "Log into your student account, go to 'My Schedule', and click 'Reschedule' or 'Cancel'. Changes made less than 24 hours before your appointment may incur a fee. For emergencies, contact our office directly.",
        keywords: ["reschedule", "change time", "cancel appointment", "running late", "modify booking", "move my lesson", "change class date", "cancel class"],
        synonyms: ["reschedule lesson", "switch time", "change booking"],
        links: [{ text: "Student Portal", url: "/student/login" }],
        priority: 9,
        fallback_for: ["policy", "booking"]
    },
    {
        id: "refund-policy",
        category: "policy",
        question: "What's your refund policy?",
        answer_short: "Refunds depend on the service and timing. Generally, requests made **before the start date** are eligible.",
        answer_long: "If your situation requires a refund, contact our office with your booking details. We handle each case individually based on timing and circumstances. Partial refunds may apply for multi-session packages.",
        keywords: ["refund", "money back", "cancel and refund", "get refund"],
        links: [{ text: "Contact Us", url: "/contact" }],
        priority: 7
    },
    {
        id: "missed-class-policy",
        category: "policy",
        question: "What if I miss a class?",
        answer_short: "You can **make up missed classroom units** in the next available session. You must complete all units to graduate.",
        keywords: ["missed class", "makeup class", "absent", "skip class"],
        priority: 8,
        fallback_for: ["classes", "policy"]
    },

    // --- ROAD TEST ---
    {
        id: "road-test-process",
        category: "road-test",
        question: "How does the Road Test service work?",
        answer_short: "We provide the **car, insurance, and instructor** on test day. We handle paperwork, you focus on passing!",
        answer_long: "On your scheduled test day, you'll use our fully insured, MVA-compliant vehicle. Our certified instructor accompanies you, handles all administrative tasks, and the MVA examiner conducts your driving test.",
        keywords: ["road test process", "how does it work", "test day", "mva test", "license test"],
        links: [{ text: "Road Test Details", url: "/services/road-test" }],
        priority: 9
    },
    {
        id: "road-test-requirements",
        category: "road-test",
        question: "What do I need to take the road test?",
        answer_short: "You need: **Valid Learner's Permit**, **Eligibility date passed**, **60-hour practice log** (if under 25), and **signed Skills Log**.",
        answer_long: "Maryland MVA requires all these documents on test day. If you're under 25, you must have completed 60 hours of supervised practice. Make sure your permit is current and your eligibility date has arrived. We'll verify everything before your appointment.",
        keywords: ["road test requirements", "what to bring", "what do I need", "documents needed", "eligibility"],
        synonyms: ["test requirements", "MVA requirements"],
        priority: 10,
        fallback_for: ["road-test", "requirements"]
    },
    {
        id: "road-test-car-provided",
        category: "road-test",
        question: "Do you provide the car for the road test?",
        answer_short: "**Yes!** We provide a fully insured, MVA-compliant car for your road test.",
        keywords: ["provide car", "test car", "do you have a car", "car rental", "vehicle"],
        priority: 8
    },
    {
        id: "road-test-what-if-fail",
        category: "road-test",
        question: "What happens if I fail the road test?",
        answer_short: "You can reschedule and try again. We offer **discounted retry rates** for students who book with us.",
        keywords: ["fail test", "failed road test", "didn't pass", "retry", "take again"],
        priority: 6
    },

    // --- CLASSES & DRIVER'S ED ---
    {
        id: "class-schedule",
        category: "classes",
        question: "When are Driver's Ed classes held?",
        answer_short: "**Morning** (9am-12:15pm), **Evening** (6pm-9:15pm), or **Weekend** (4pm-7:15pm). Check our calendar for start dates.",
        answer_long: "Morning and Evening classes run Monday-Friday for 2 weeks. Weekend classes run Saturdays for 5 weeks. All schedules include the full 30 classroom hours plus 6 behind-the-wheel hours scheduled separately.",
        keywords: ["class schedule", "when are classes", "morning class", "evening class", "weekend class", "times", "class time", "drivers ed schedule", "what days are classes"],
        synonyms: ["class calendar", "session schedule", "course schedule"],
        links: [{ text: "View Schedule", url: "/services/drivers-education-packages" }],
        priority: 9,
        fallback_for: ["classes"]
    },
    {
        id: "class-format",
        category: "classes",
        question: "Are classes in-person or online?",
        answer_short: "Classes are typically **in-person** at our office. Contact us to ask about online or hybrid options.",
        keywords: ["online class", "in person", "virtual", "classroom", "where are classes"],
        priority: 7
    },
    {
        id: "btw-after-class",
        category: "classes",
        question: "What happens after I complete the 36-hour class?",
        answer_short: "You'll receive your **completion certificate** and can schedule your **6 hours of behind-the-wheel training**.",
        answer_long: "After finishing classroom hours, you're eligible for BTW sessions. We'll help you schedule these at your convenience. Once you complete all 6 BTW hours, you'll get your final certificate needed for the MVA.",
        keywords: ["after class", "next steps", "completed 36 hour", "what's next", "finished classroom"],
        priority: 8
    },
    {
        id: "permit-before-class",
        category: "requirements",
        question: "Do I need a permit before starting Driver's Ed?",
        answer_short: "**No permit needed** to start classroom training. You'll need your permit before behind-the-wheel sessions.",
        keywords: ["need permit", "permit required", "before class", "start without permit"],
        priority: 9,
        fallback_for: ["requirements", "classes"]
    },
    {
        id: "age-requirement",
        category: "requirements",
        question: "How old do I need to be?",
        answer_short: "You must be **at least 15 years and 9 months** to start Driver's Education in Maryland.",
        keywords: ["age", "how old", "age requirement", "minimum age", "15"],
        priority: 8
    },

    // --- DRIVING PRACTICE ---
    {
        id: "practice-pickup",
        category: "booking",
        question: "Do you pick me up for driving practice?",
        answer_short: "We currently **do not offer pickup or drop-off** for driving practice sessions.",
        keywords: ["pickup", "pick me up", "do you pick up", "ride", "transportation", "dropoff"],
        priority: 9
    },
    {
        id: "practice-without-course",
        category: "booking",
        question: "Can I book driving practice without taking Driver's Ed?",
        answer_short: "**Absolutely!** Driving practice is available to anyone with a valid learner's permit.",
        keywords: ["practice only", "without drivers ed", "just lessons", "skip class", "no class needed", "do i need drivers ed first"],
        synonyms: ["practice without course", "lessons only"],
        priority: 7
    },
    {
        id: "practice-areas",
        category: "booking",
        question: "Where do you provide driving practice?",
        answer_short: "Driving practice sessions are available in **Silver Spring and Bethesda**. Contact us to confirm the best session location for you.",
        keywords: ["pickup area", "service area", "where do you go", "coverage", "locations served"],
        links: [{ text: "Contact", url: "/contact" }],
        priority: 6
    },

    // --- LOCATIONS & CONTACT ---
    {
        id: "locations",
        category: "general",
        question: "Where are you located?",
        answer_short: "**Silver Spring**: 10111 Colesville Rd Suite 103 | **Bethesda**: Contact for details",
        keywords: ["location", "where", "address", "silver spring", "bethesda", "office", "directions", "map", "colesville road"],
        synonyms: ["where are you located", "office address", "school address"],
        links: [{ text: "Get Directions", url: "/contact" }],
        priority: 10,
        fallback_for: ["general"]
    },
    {
        id: "office-hours",
        category: "general",
        question: "What are your office hours?",
        answer_short: "We're open **Monday-Saturday, 9am-6pm**. Online booking is available 24/7.",
        keywords: ["hours", "open", "office hours", "when are you open", "closed", "business hours", "weekend hours", "saturday hours", "sunday"],
        synonyms: ["opening hours", "working hours", "store hours"],
        priority: 8
    },
    {
        id: "contact-info",
        category: "general",
        question: "How can I contact you?",
        answer_short: "📞 **(301) 755-6986** | 📧 **selamdrivingschool@gmail.com**",
        keywords: ["contact", "phone", "email", "call", "reach you", "number", "customer service", "support"],
        synonyms: ["contact number", "contact email", "how do i reach you"],
        links: [{ text: "Contact Page", url: "/contact" }],
        priority: 10,
        fallback_for: ["general"]
    },

    // --- DOCUMENTS & REQUIREMENTS ---
    {
        id: "documents-to-start",
        category: "requirements",
        question: "What documents do I need to start?",
        answer_short: "For **Driver's Ed**: Just a valid ID. For **BTW lessons**: You need your Learner's Permit.",
        keywords: ["documents", "what to bring", "id", "paperwork", "requirements", "required documents", "needed papers"],
        synonyms: ["document checklist", "what should i bring", "required paperwork"],
        priority: 9
    },
    {
        id: "get-permit",
        category: "requirements",
        question: "How do I get my learner's permit?",
        answer_short: "Visit the **MVA with your completion certificate** (after classroom) to take the knowledge test and get your permit.",
        answer_long: "After finishing your classroom training, you'll receive a completion certificate. Bring this to any Maryland MVA location along with proof of identity, residency, and Social Security number. You'll take a written knowledge test and, if you pass, receive your learner's permit.",
        keywords: ["get permit", "learner's permit", "how to get permit", "mva permit"],
        priority: 7
    },

    // --- SPECIAL SITUATIONS ---
    {
        id: "adult-learner",
        category: "general",
        question: "Do you teach adults?",
        answer_short: "**Yes!** We welcome students of all ages. Adults can take practice lessons or refresher courses.",
        keywords: ["adult", "older student", "not a teen", "over 18", "adult lessons"],
        priority: 6
    },
    {
        id: "nervous-beginner",
        category: "general",
        question: "I'm nervous about driving. Can you help?",
        answer_short: "Absolutely! Our patient instructors specialize in building confidence for nervous beginners.",
        keywords: ["nervous", "scared", "anxiety", "beginner", "first time", "afraid"],
        priority: 7
    },
    {
        id: "language-support",
        category: "general",
        question: "Do you offer instruction in other languages?",
        answer_short: "We have multilingual instructors. Call **(301) 755-6986** to discuss your specific language needs.",
        keywords: ["language", "spanish", "amharic", "foreign language", "non-english"],
        priority: 5
    },

    // --- PACKAGE SPECIFIC ---
    {
        id: "package-10-hour",
        category: "pricing",
        question: "What's included in the 10-Hour Package?",
        answer_short: "**5 sessions of 2 hours each** with one-on-one instruction and discounted pricing.",
        keywords: ["10 hour", "ten hour", "package deal", "bulk lessons", "5 sessions", "2 hour session", "ten hour package"],
        synonyms: ["10-hour package", "10hr package", "practice bundle"],
        links: [{ text: "View Package", url: "/services/driving-practice-packages" }],
        priority: 8
    },
    {
        id: "drivers-ed-includes",
        category: "classes",
        question: "What's included in Driver's Education?",
        answer_short: "**30 hours classroom** + **6 hours BTW** + all materials + completion certificate.",
        keywords: ["what's included", "drivers ed includes", "what do I get"],
        priority: 8
    },

    // --- PAYMENT & BILLING ---
    {
        id: "payment-plans",
        category: "pricing",
        question: "Do you offer payment plans?",
        answer_short: "Payment is typically due at booking. For special arrangements, please call our office at **(301) 755-6986**.",
        keywords: ["payment plan", "installment", "pay later", "finance"],
        priority: 5
    },
    {
        id: "group-discount",
        category: "pricing",
        question: "Do you offer group or family discounts?",
        answer_short: "Contact us for group rates. We may offer discounts for multiple family members enrolling together.",
        keywords: ["discount", "group rate", "family discount", "sibling discount"],
        priority: 5
    },

    // --- EXPANDED WEBSITE-BASED FAQ COVERAGE ---
    {
        id: "classes-morning-time",
        category: "classes",
        question: "What time is the Driver's Ed morning class?",
        answer_short: "Morning Driver's Ed classes run **9:00 AM - 12:15 PM**.",
        keywords: ["morning class time", "9:00", "12:15", "drivers ed morning schedule"],
        synonyms: ["morning class hours", "what time is morning class", "morning session"],
        links: [{ text: "Morning Schedule", url: "/services/drivers-education-schedule?classification=Morning" }],
        priority: 9
    },
    {
        id: "classes-evening-time",
        category: "classes",
        question: "What time is the Driver's Ed evening class?",
        answer_short: "Evening Driver's Ed classes run **6:00 PM - 9:15 PM**.",
        keywords: ["evening class time", "6:00", "9:15", "drivers ed evening schedule"],
        synonyms: ["evening class hours", "night class", "what time is evening class"],
        links: [{ text: "Evening Schedule", url: "/services/drivers-education-schedule?classification=Evening" }],
        priority: 9
    },
    {
        id: "classes-weekend-time",
        category: "classes",
        question: "What time is the Driver's Ed weekend class?",
        answer_short: "Weekend Driver's Ed classes run **4:00 PM - 7:15 PM**.",
        keywords: ["weekend class time", "4:00", "7:15", "drivers ed weekend schedule"],
        synonyms: ["weekend class hours", "saturday class time", "what time is weekend class"],
        links: [{ text: "Weekend Schedule", url: "/services/drivers-education-schedule?classification=Weekend" }],
        priority: 9
    },
    {
        id: "classes-morning-format",
        category: "classes",
        question: "How long is the morning Driver's Ed program?",
        answer_short: "The morning track is a **2-week course, Monday through Friday**.",
        keywords: ["morning duration", "2 weeks", "monday friday", "drivers ed track"],
        priority: 7
    },
    {
        id: "classes-evening-format",
        category: "classes",
        question: "How long is the evening Driver's Ed program?",
        answer_short: "The evening track is a **2-week course, Monday through Friday**.",
        keywords: ["evening duration", "2 weeks", "weekday class", "drivers ed evening"],
        priority: 7
    },
    {
        id: "classes-weekend-length",
        category: "classes",
        question: "How long is the weekend Driver's Ed program?",
        answer_short: "The weekend track runs for **5 weeks**.",
        keywords: ["weekend duration", "5 weeks", "weekend program length"],
        priority: 7
    },
    {
        id: "classes-what-36-hours-means",
        category: "classes",
        question: "What does the 36-hour Driver's Ed requirement include?",
        answer_short: "It includes **30 hours classroom** plus **6 hours behind-the-wheel** training.",
        keywords: ["36 hour requirement", "30 classroom", "6 hours driving", "mva requirement"],
        priority: 9
    },
    {
        id: "classes-btw-included-hours",
        category: "classes",
        question: "Are behind-the-wheel hours included with Driver's Ed?",
        answer_short: "Yes. Driver's Ed includes **6 hours of private behind-the-wheel training**.",
        keywords: ["btw included", "behind the wheel included", "6 hours included", "drivers ed package"],
        priority: 8
    },
    {
        id: "classes-bethesda-option",
        category: "classes",
        question: "Do you offer Driver's Ed in Bethesda?",
        answer_short: "Yes, we offer a **Bethesda Driver's Ed option** with location-specific packages.",
        keywords: ["bethesda drivers ed", "bethesda class", "bethesda location", "premium pricing"],
        links: [{ text: "Bethesda Driver's Ed Packages", url: "/services/drivers-education-packages?location=bethesda" }],
        priority: 7
    },
    {
        id: "booking-drivers-ed-morning-link",
        category: "booking",
        question: "Where do I enroll in a morning Driver's Ed class?",
        answer_short: "Use the Morning schedule page to pick an available class date and enroll online.",
        keywords: ["enroll morning", "book morning class", "morning registration"],
        links: [{ text: "Enroll Morning Class", url: "/services/drivers-education-schedule?classification=Morning" }],
        priority: 7
    },
    {
        id: "booking-drivers-ed-evening-link",
        category: "booking",
        question: "Where do I enroll in an evening Driver's Ed class?",
        answer_short: "Use the Evening schedule page to pick an available class date and enroll online.",
        keywords: ["enroll evening", "book evening class", "evening registration"],
        links: [{ text: "Enroll Evening Class", url: "/services/drivers-education-schedule?classification=Evening" }],
        priority: 7
    },
    {
        id: "booking-drivers-ed-weekend-link",
        category: "booking",
        question: "Where do I enroll in a weekend Driver's Ed class?",
        answer_short: "Use the Weekend schedule page to select an upcoming class and complete checkout.",
        keywords: ["enroll weekend", "book weekend class", "weekend registration"],
        links: [{ text: "Enroll Weekend Class", url: "/services/drivers-education-schedule?classification=Weekend" }],
        priority: 7
    },
    {
        id: "booking-rsep-link",
        category: "booking",
        question: "Where can I register for RSEP?",
        answer_short: "You can register from our RSEP packages page and choose an upcoming class date.",
        keywords: ["register rsep", "rsep booking", "rsep class", "book rsep", "rsep schedule", "rsep registration"],
        synonyms: ["enroll rsep", "rsep signup", "rsep program booking"],
        links: [{ text: "Register for RSEP", url: "/services/rsep-packages" }],
        priority: 9
    },
    {
        id: "booking-dip-link",
        category: "booking",
        question: "Where can I register for DIP?",
        answer_short: "You can register from our DIP packages page and choose an upcoming class date.",
        keywords: ["register dip", "dip booking", "driving improvement booking", "book dip", "dip schedule", "dip registration"],
        synonyms: ["enroll dip", "dip signup", "driving improvement registration"],
        links: [{ text: "Register for DIP", url: "/services/improvement-program-packages" }],
        priority: 9
    },
    {
        id: "booking-timezone-note",
        category: "booking",
        question: "What timezone are class times shown in?",
        answer_short: "Class booking pages show times in **Eastern Time (GMT-05:00)**.",
        keywords: ["timezone", "eastern time", "gmt-05", "class time zone"],
        priority: 6
    },
    {
        id: "pricing-practice-1hr",
        category: "pricing",
        question: "How much is the 1-hour driving practice lesson?",
        answer_short: "The 1-hour practice lesson starts at **$65** in Silver Spring (**$75** Bethesda).",
        keywords: ["1 hour practice price", "65 dollars", "practice 1hr cost"],
        synonyms: ["one hour lesson price", "1hr cost", "single lesson cost"],
        links: [{ text: "1-Hour Practice Package", url: "/services/driving-practice-packages" }],
        priority: 9
    },
    {
        id: "pricing-practice-2hr",
        category: "pricing",
        question: "How much is the 2-hour driving practice lesson?",
        answer_short: "The 2-hour practice lesson starts at **$120** in Silver Spring (**$130** Bethesda).",
        keywords: ["2 hour practice price", "120 dollars", "practice 2hr cost"],
        synonyms: ["two hour lesson price", "2hr cost", "double lesson cost"],
        links: [{ text: "2-Hour Practice Package", url: "/services/driving-practice-packages" }],
        priority: 9
    },
    {
        id: "pricing-practice-10hr",
        category: "pricing",
        question: "How much is the 10-hour driving practice package?",
        answer_short: "The 10-hour package starts at **$550** in Silver Spring (**$600** Bethesda).",
        keywords: ["10 hour package price", "550", "600", "ten hour price"],
        synonyms: ["10hr package cost", "ten hour lesson package", "five 2-hour sessions cost"],
        links: [{ text: "10-Hour Practice Package", url: "/services/driving-practice-packages" }],
        priority: 9
    },
    {
        id: "pricing-roadtest-escort-package",
        category: "pricing",
        question: "How much is Road Test MVA Escort only?",
        answer_short: "Road Test Escort starts at **$120** in Silver Spring (**$140** Bethesda).",
        keywords: ["escort price", "road test escort cost", "mva escort 120"],
        synonyms: ["escort only price", "road test car + instructor cost", "test day escort fee"],
        links: [{ text: "Road Test Packages", url: "/services/road-test-packages" }],
        priority: 9
    },
    {
        id: "pricing-roadtest-1hr-package",
        category: "pricing",
        question: "How much is Road Test + 1-hour practice?",
        answer_short: "Road Test + 1-hour practice starts at **$200** in Silver Spring (**$220** Bethesda).",
        keywords: ["road test 1 hour package", "200 dollars", "220 bethesda"],
        synonyms: ["road test + warmup price", "1hr road test package", "road test one hour prep cost"],
        links: [{ text: "Road Test + 1hr", url: "/services/road-test-packages" }],
        priority: 9
    },
    {
        id: "pricing-roadtest-2hr-package",
        category: "pricing",
        question: "How much is Road Test + 2-hour practice?",
        answer_short: "Road Test + 2-hour practice starts at **$265** in Silver Spring (**$285** Bethesda).",
        keywords: ["road test 2 hour package", "265 dollars", "285 bethesda"],
        synonyms: ["road test intensive package price", "2hr road test prep cost", "road test two hour package"],
        links: [{ text: "Road Test + 2hr", url: "/services/road-test-packages" }],
        priority: 9
    },
    {
        id: "roadtest-escort-whats-included",
        category: "road-test",
        question: "What is included in Road Test MVA Escort?",
        answer_short: "It includes an **MVA-compliant car, certified instructor escort, full insurance coverage, and paperwork help**.",
        keywords: ["escort includes", "what included escort", "road test package details"],
        links: [{ text: "Escort Package Details", url: "/services/road-test-packages" }],
        priority: 8
    },
    {
        id: "roadtest-1hr-whats-included",
        category: "road-test",
        question: "What is included in Road Test + 1-hour practice?",
        answer_short: "You get the test vehicle plus a **1-hour warm-up lesson**, parking review, and confidence prep.",
        keywords: ["1 hour warm up", "road test warmup", "parking review before test"],
        links: [{ text: "Road Test + 1hr Details", url: "/services/road-test-packages" }],
        priority: 7
    },
    {
        id: "roadtest-2hr-whats-included",
        category: "road-test",
        question: "What is included in Road Test + 2-hour practice?",
        answer_short: "You get the test vehicle plus **2-hour intensive practice**, detailed skill review, and mock test scenarios.",
        keywords: ["2 hour intensive", "mock test scenarios", "road test prep package"],
        links: [{ text: "Road Test + 2hr Details", url: "/services/road-test-packages" }],
        priority: 7
    },
    {
        id: "rsep-validity",
        category: "requirements",
        question: "How long is the RSEP certificate valid?",
        answer_short: "Your RSEP completion certificate is valid for **1 year**.",
        keywords: ["rsep valid", "certificate valid one year", "rsep expiration"],
        synonyms: ["rsep certificate expiration", "how long does rsep last", "rsep validity period"],
        priority: 8,
        fallback_for: ["requirements", "classes"]
    },
    {
        id: "rsep-requirement-international",
        category: "requirements",
        question: "Is RSEP required for international license holders in Maryland?",
        answer_short: "Yes. RSEP is listed as required for **international license holders converting to a Maryland license**.",
        keywords: ["international license maryland", "rsep required", "license conversion"],
        synonyms: ["foreign license conversion", "out of country license maryland", "international driver maryland requirement"],
        links: [{ text: "RSEP Program", url: "/services/rsep" }],
        priority: 9,
        fallback_for: ["requirements", "road-test"]
    },
    {
        id: "rsep-course-topics",
        category: "classes",
        question: "What does the RSEP class cover?",
        answer_short: "RSEP covers the approved **Alcohol & Drug Education curriculum**, includes a final exam, and provides a digital certificate.",
        keywords: ["rsep topics", "alcohol and drug education", "rsep exam", "digital certificate"],
        links: [{ text: "RSEP Details", url: "/services/rsep" }],
        priority: 7
    },
    {
        id: "dip-court-mva",
        category: "requirements",
        question: "Who should take the Driving Improvement Program (DIP)?",
        answer_short: "DIP is for drivers **referred by the MVA or court system** and those needing point-reduction education.",
        keywords: ["dip for who", "court referred", "mva referred", "point reduction class"],
        synonyms: ["who needs dip", "court ordered dip", "mva point class"],
        links: [{ text: "DIP Program", url: "/services/improvement-program" }],
        priority: 9,
        fallback_for: ["requirements", "policy"]
    },
    {
        id: "dip-reporting-speed",
        category: "policy",
        question: "How quickly is DIP completion reported?",
        answer_short: "DIP completion is reported electronically to MVA, with messaging on the site indicating **within 24 hours**.",
        keywords: ["dip reporting", "how fast mva update", "electronic reporting 24 hours"],
        links: [{ text: "DIP Details", url: "/services/improvement-program" }],
        priority: 7
    },
    {
        id: "dip-same-day-processing",
        category: "policy",
        question: "Does DIP offer same-day processing?",
        answer_short: "Yes. The DIP page highlights **same-day processing** and electronic reporting workflows.",
        keywords: ["same day processing dip", "dip fast processing", "dip certificate timing"],
        links: [{ text: "DIP Registration", url: "/services/improvement-program-packages" }],
        priority: 6
    },
    {
        id: "location-sunday-closed",
        category: "general",
        question: "Are you open on Sundays?",
        answer_short: "Our office location section lists **Sunday as closed**.",
        keywords: ["sunday hours", "open sunday", "closed sunday", "weekend office hours"],
        links: [{ text: "Contact & Location", url: "/contact" }],
        priority: 6
    },

    // --- GENERAL FALLBACKS ---
    {
        id: "general-help",
        category: "general",
        question: "How can you help me?",
        answer_short: "I can answer questions about **pricing, booking, class schedules, road tests, policies**, and more!",
        keywords: ["help", "what can you do", "assistance"],
        priority: 10,
        fallback_for: ["general"]
    }
];

export const GENERAL_GREETING = "Hi there! 👋 I'm the Selam Driving School assistant. I can help with pricing, scheduling, road tests, and more. How can I help you today?";

export const CATEGORY_FALLBACKS: Record<FAQCategory, string> = {
    pricing: "I can help with pricing! Are you asking about Driver's Ed, Driving Practice, or Road Test packages?",
    booking: "I can help you book! Are you looking to schedule Driver's Ed classes, driving practice, or a road test?",
    "road-test": "I can help with road test questions! Are you asking about pricing, requirements, or the test process?",
    classes: "I can help with class information! Are you asking about schedules, format, or what happens after completion?",
    policy: "I can help with policies! Are you asking about rescheduling, cancellations, or refunds?",
    requirements: "I can help with requirements! Are you asking about permits, age limits, or documents needed?",
    general: "I'm here to help! Could you tell me more about what you're looking for?"
};
