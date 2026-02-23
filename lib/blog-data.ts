export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    author: string;
    category: string;
    image: string;
    excerpt: string;
    content: {
        intro: string;
        sections: {
            heading: string;
            content: string;
        }[];
        bullets: string[];
        quote: string;
        cta: string;
    };
}

export const blogPosts: BlogPost[] = [
    {
        slug: "how-to-pass-road-test",
        title: "How to Pass the Maryland Road Test on Your First Try (2026 Guide)",
        date: "January 15, 2026",
        author: "Selam Driving School",
        category: "Road Test Guides",
        image: "/blog/pass-road-test.png",
        excerpt: "Passing the Maryland MVA road test doesn't have to be stressful. Follow our comprehensive 2026 guide to ace your test on the first attempt.",
        content: {
            intro: "The Maryland MVA road test is the final hurdle standing between you and your driver's license. For many, it's a source of anxiety, but with the right preparation, it's completely manageable. In 2026, the standards remain high, focusing on safety, observation, and control. This guide breaks down exactly what you need to do to pass on your very first try.",
            sections: [
                {
                    heading: "Master the Closed Course Maneuvers",
                    content: "Before you even hit the public road, you must demonstrate your ability to control the vehicle in a closed course environment. This includes the dreaded parallel parking and the reverse two-point turn. Practice these until they are second nature. Remember, you have a time limit, but accuracy is more important than speed."
                },
                {
                    heading: "Observation is Key",
                    content: "The number one reason students fail is lack of observation. You must exaggerate your head checks. When changing lanes, merging, or turning, physically turn your head to check your blind spots. Mirrors are not enough for the MVA examiner; they need to see you looking."
                },
                {
                    heading: "Smoothness and Control",
                    content: "Jerky braking, rapid acceleration, and sharp steering can all count against you. Aim for a smooth, comfortable ride. Brake early and gently, accelerate progressively, and make your turns controlled and steady. This demonstrates confidence and competence."
                }
            ],
            bullets: [
                "Practice parallel parking in a standard 10x20 foot space.",
                "Always come to a complete stop at stop signs—feel the 'kick back'.",
                "Maintain a safe following distance of at least 3-4 seconds.",
                "Check your mirrors every 5-8 seconds while driving."
            ],
            quote: "Confidence comes from competence. If you've put in the practice hours, the test is just a formality.",
            cta: "Ready to ace your test? Book a mock road test with our expert instructors today."
        }
    },
    {
        slug: "maryland-road-test-parallel-parking",
        title: "Maryland Road Test Parallel Parking: Full Step-by-Step Breakdown",
        date: "February 2, 2026",
        author: "Selam Driving School",
        category: "Road Test Guides",
        image: "/blog/parallel-parking.png",
        excerpt: "Parallel parking is the most feared part of the driving test. We break it down into simple, repeatable steps that work every time.",
        content: {
            intro: "Parallel parking strikes fear into the hearts of many new drivers, but it's simply a geometry problem. In Maryland, you have to park your vehicle within a specific space without hitting the cones or the curb. The good news is that there is a formula you can learn. Once you know the reference points, you can park perfectly every single time.",
            sections: [
                {
                    heading: "The Setup Position",
                    content: "Success starts with your starting position. Pull up parallel to the car (or cones) in front of the space. You should be about 2-3 feet away from the side of the other vehicle, with your back bumpers aligned. This alignment is crucial for the rest of the maneuver."
                },
                {
                    heading: "The Turn-In",
                    content: "Put the car in reverse. Turn your wheel all the way to the right. Back up slowly until your car is at a 45-degree angle to the curb. A good reference point is when you can see the headlight of the car behind you in your driver's side mirror. Stop."
                },
                {
                    heading: "The Straight Back",
                    content: "Straighten your wheel. Back up straight until your front bumper clears the back bumper of the car in front of you. This is the 'insertion' phase. Stop again."
                },
                {
                    heading: "The Finish",
                    content: "Turn your wheel all the way to the left and continue backing up into the space. Your car should swing neatly into the spot parallel to the curb. Straighten out and center yourself in the space."
                }
            ],
            bullets: [
                "Align your back bumper with the front car's back bumper.",
                "Turn fully right, back to 45 degrees.",
                "Straighten wheel, back until front clears.",
                "Turn fully left to swing into the spot."
            ],
            quote: "Don't rush. You have time. Focus on hitting your reference points exactly.",
            cta: "Struggling with parking? Our instructors can teach you the foolproof method in one lesson."
        }
    },
    {
        slug: "top-10-mistakes-road-test",
        title: "Top 10 Mistakes Students Make on the Road Test (And How to Avoid Them)",
        date: "January 28, 2026",
        author: "Selam Driving School",
        category: "Tips & Tricks",
        image: "/blog/speedometer-precision.png",
        excerpt: "Avoid the common pitfalls that cause students to fail. We list the top 10 mistakes and provide easy fixes for each.",
        content: {
            intro: "Failing the road test is often due to simple, preventable errors rather than a lack of driving skill. Nerves can cause you to forget the basics. By identifying the most common mistakes students make, you can consciously avoid them and increase your chances of passing significantly.",
            sections: [
                {
                    heading: "Rolling Stops",
                    content: "This is the most common automatic fail. You must come to a COMPLETE stop at stop signs and red lights. Your wheels must cease all motion. Count to three before moving again to be safe."
                },
                {
                    heading: "Improper Lane Changes",
                    content: "Failing to signal, failing to check mirrors, or failing to check your blind spot before changing lanes will result in points deducted or failure. Always Signal, Mirror, Head Check (SMOG)."
                },
                {
                    heading: "Speeding (Even a Little)",
                    content: "The speed limit is a hard limit, not a suggestion. Driving 31 mph in a 30 mph zone can be grounds for failure. Conversely, driving too slowly can also be dangerous. Aim to stay exactly at or slightly below the limit."
                }
            ],
            bullets: [
                "Stop completely behind the white line.",
                "Always check blind spots for every lateral move.",
                "Watch your speed carefully, especially in school zones.",
                "Keep both hands on the wheel (9 and 3 position)."
            ],
            quote: "A rolling stop is no stop at all. Freeze the car for a full second.",
            cta: "Want a mock test to spot your mistakes? Schedule one with us today."
        }
    },
    {
        slug: "5-signs-ready-for-road-test",
        title: "5 Signs You’re Ready for Your Road Test in Maryland",
        date: "March 5, 2026",
        author: "Selam Driving School",
        category: "Tips & Tricks",
        image: "/blog/focused-driver.png",
        excerpt: "Not sure if you should book your test yet? Check for these 5 signs that indicate you're fully prepared to pass.",
        content: {
            intro: "Booking your road test too early can lead to failure and disappointment, while waiting too long can cause unnecessary anxiety. How do you know when you're truly ready? It's not just about hours logged; it's about your comfort level and consistency behind the wheel. Here are the 5 key signs.",
            sections: [
                {
                    heading: "1. You Don't Need Constant Instruction",
                    content: "If your supervising driver or instructor rarely has to intervene or give verbal cues, you are becoming an independent driver. You should be making decisions on your own."
                },
                {
                    heading: "2. Your Maneuvers Are Consistent",
                    content: "You can parallel park and perform a 3-point turn successfully 9 out of 10 times, not just occasionally. Consistency is key for the test."
                },
                {
                    heading: "3. You Scan Automatically",
                    content: "Checking mirrors and blind spots has become a habit, not something you have to remind yourself to do. You are aware of your surroundings at all times."
                }
            ],
            bullets: [
                "You drive proactively, not reactively.",
                "You feel calm, not panicked, in traffic.",
                "You understand right-of-way rules intuitively.",
                "You can handle mistakes without losing composure."
            ],
            quote: "When driving feels boring rather than terrifying, you're probably ready.",
            cta: "Think you're ready? Let's verify with a pre-test evaluation."
        }
    },
    {
        slug: "maryland-glp-explained",
        title: "The Complete Maryland Graduated Licensing Program (GLP) Explained",
        date: "January 20, 2026",
        author: "Selam Driving School",
        category: "Education",
        image: "/blog/licensing-stages.png",
        excerpt: "Confused by the steps from Rookie to Pro? We explain the Learner's, Provisional, and Full License stages in plain English.",
        content: {
            intro: "Maryland uses a Graduated Licensing System (GLS) to help new drivers gain experience and skills over time in low-risk environments. It involves three stages: the Learner's Permit, the Provisional License, and the Full Driver's License. Understanding the restrictions and requirements of each stage is vital for parents and new drivers.",
            sections: [
                {
                    heading: "Stage 1: Learner's Permit",
                    content: "This is the entry level. You must pass a knowledge test. You can only drive with a supervising driver age 21+ (licensed for 3+ years). You must hold this for 9 months violation-free and log 60 hours of practice."
                },
                {
                    heading: "Stage 2: Provisional License",
                    content: "After passing the road test, you get a Provisional License. You can drive alone, but with restrictions: no driving between 12 AM and 5 AM (unless for work/school), and passenger limits for drivers under 18. You must hold this for 18 months violation-free."
                },
                {
                    heading: "Stage 3: Full License",
                    content: "Once you meet the provisional requirements, you graduate to a Full License. All time and passenger restrictions are lifted. You are now a fully licensed Maryland driver."
                }
            ],
            bullets: [
                "Learner's: Supervised driving only.",
                "Provisional: Unsupervised with curfew/passenger limits.",
                "Full: No restrictions.",
                "Violations restart the clock at any stage."
            ],
            quote: "The GLS saves lives by ensuring drivers have experience before facing high-risk situations alone.",
            cta: "Need help with your 60 hours? We can help you log them."
        }
    },
    {
        slug: "winter-driving-tips-maryland",
        title: "Maryland Winter Driving Tips for New Drivers",
        date: "December 10, 2025",
        author: "Selam Driving School",
        category: "Safety",
        image: "/blog/winter-driving-safety.png",
        excerpt: "Maryland winters can be unpredictable. Learn how to handle snow, ice, and black ice safely with these essential tips.",
        content: {
            intro: "Maryland winters bring a mix of rain, sleet, snow, and the dangerous black ice. For new drivers, these conditions can be terrifying. The key to winter driving is preparation and adjusting your driving style. You cannot drive in January the same way you drive in July.",
            sections: [
                {
                    heading: "Slow Down and Increase Distance",
                    content: "Traction is significantly reduced on cold or wet roads. Reduce your speed by at least 10-15 mph below the limit when conditions are poor. Increase your following distance from 3-4 seconds to 8-10 seconds to allow for longer stopping distances."
                },
                {
                    heading: "Beware of Black Ice",
                    content: "Black ice is invisible ice that forms on bridges, overpasses, and shaded areas. If the road looks wet but there is no spray coming from tires, it might be ice. Do not brake or steer sharply; lift off the gas and glide over it."
                },
                {
                    heading: "Vehicle Prep",
                    content: "Keep your gas tank at least half full to prevent fuel line freeze. Ensure your tires have good tread. Clear ALL snow and ice from your car—roof, hood, and windows—before driving. It's the law."
                }
            ],
            bullets: [
                "Drive slower than you think is necessary.",
                "Increase following distance to 8-10 seconds.",
                "Watch for black ice on bridges.",
                "Clear all snow from your vehicle."
            ],
            quote: "If you don't have to drive in a snowstorm, don't. The safest choice is staying home.",
            cta: "Nervous about winter driving? Take a bad-weather practice lesson with us."
        }
    }
];

