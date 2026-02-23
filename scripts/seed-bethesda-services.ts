
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local')
dotenv.config({ path: envPath })

console.log('Loading env from:', envPath)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) console.log('❌ NEXT_PUBLIC_SUPABASE_URL missing')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.log('❌ SUPABASE_SERVICE_ROLE_KEY missing')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const bethesdaServices = [
    // Driver's Ed - Bethesda (Higher Price)
    {
        name: "Driver's Ed (Morning) - Bethesda",
        slug: "drivers-ed-morning-bethesda",
        original_slug: "drivers-ed-morning",
        price: 450.00,
        description: "2 Week Theory Class (Morning) at Bethesda Location"
    },
    {
        name: "Driver's Ed (Evening) - Bethesda",
        slug: "drivers-ed-evening-bethesda",
        original_slug: "drivers-ed-evening",
        price: 450.00,
        description: "2 Week Theory Class (Evening) at Bethesda Location"
    },
    {
        name: "Driver's Ed (Weekend) - Bethesda",
        slug: "drivers-ed-weekend-bethesda",
        original_slug: "drivers-ed-weekend",
        price: 510.00,
        description: "5 Week Theory Class (Weekend) at Bethesda Location"
    },
    // Practice - Bethesda
    {
        name: "Driving Practice (1 Hour) - Bethesda",
        slug: "driving-practice-1hr-bethesda",
        original_slug: "driving-practice-1hr",
        price: 75.00,
        description: "Single 1-hour private driving lesson (Bethesda)"
    },
    {
        name: "Driving Practice (2 Hours) - Bethesda",
        slug: "driving-practice-2hr-bethesda",
        original_slug: "driving-practice-2hr",
        price: 130.00,
        description: "Comprehensive 2-hour private lesson (Bethesda)"
    },
    {
        name: "Driving Practice (10 Hours) - Bethesda",
        slug: "driving-practice-10hr-bethesda",
        original_slug: "driving-practice-10hr",
        price: 600.00,
        description: "Five 2-hour comprehensive lessons (Bethesda)"
    },
    // Road Test - Bethesda
    {
        name: "Road Test MVA Escort - Bethesda Pickup",
        slug: "road-test-escort-bethesda",
        original_slug: "road-test-escort",
        price: 140.00,
        description: "MVA Road Test Escort Service (Bethesda Pickup)"
    },
    {
        name: "Road Test + 1hr Practice - Bethesda",
        slug: "road-test-1hr-bethesda",
        original_slug: "road-test-1hr",
        price: 220.00,
        description: "MVA Road Test + 1hr Practice (Bethesda)"
    },
    {
        name: "Road Test + 2hr Practice - Bethesda",
        slug: "road-test-2hr-bethesda",
        original_slug: "road-test-2hr",
        price: 285.00,
        description: "MVA Road Test + 2hr Practice (Bethesda)"
    }
]

async function seedBethesdaServices() {
    console.log('🌱 Seeding Bethesda Services...')

    for (const service of bethesdaServices) {
        // 1. Check if exists
        const { data: existing } = await supabase
            .from('services')
            .select('id')
            .eq('slug', service.slug)
            .single()

        if (existing) {
            console.log(`✅ [Exists] ${service.slug}`)
            continue
        }

        // 2. Fetch original to get duration/meta
        const { data: original } = await supabase
            .from('services')
            .select('duration_minutes')
            .eq('slug', service.original_slug)
            .single()

        const duration = original?.duration_minutes || 60

        // 3. Insert
        const { error: insertError } = await supabase
            .from('services')
            .insert({
                name: service.name,
                slug: service.slug,
                description: service.description,
                price: service.price,
                duration_minutes: duration,
                is_active: true
            })

        if (insertError) {
            console.error(`❌ Failed to insert ${service.slug}:`, insertError.message)
        } else {
            console.log(`✨ [Created] ${service.slug} ($${service.price})`)
        }
    }

    console.log('🏁 Seeding complete.')
}

seedBethesdaServices()
