
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually load .env.local since dotenv might not be available
try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8')
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=')
            if (parts.length >= 2) {
                const key = parts[0].trim()
                const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '')
                if (key && value) {
                    process.env[key] = value
                }
            }
        })
    }
} catch (e) {
    console.error('Error loading .env.local', e)
}

// Need to load env vars if running as standalone script, but tsx usually loads .env
// We'll rely on process.env being populated by tsx or the environment


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

if (supabaseServiceRoleKey === supabaseAnonKey) {
    console.warn("WARNING: Service Role Key appears to be identical to Anon Key. RLS policies may hide data.")
} else {
    console.log("Admin Access Verified: Service Role Key is distinct from Anon Key.")
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const slugsToDelete = ['basic', 'premium', 'standard']

async function cleanupServices() {
    // Audit step: List what's currently in the DB
    const { data: allServices, error: listError } = await supabase
        .from('services')
        .select('*')

    if (listError) {
        console.error("Error listing services:", listError)
    } else {
        if (allServices && allServices.length > 0) {
            console.log("Schema Columns:", Object.keys(allServices[0]).join(', '))
        }

        console.log("\n--- Searching for Class Services ---")
        const keywords = ['Education', 'Improvement', 'Alcohol', 'Drug', 'DIP', 'RSEP', '3-Hour']
        const targets = allServices?.filter(s =>
            keywords.some(k =>
                (s.name && s.name.includes(k)) ||
                (s.slug && s.slug.includes(k)) ||
                (s.description && s.description.includes(k))
            )
        )
        console.table(targets)
        console.log("------------------------------------\n")
    }

    // Don't delete yet, just find them
    // console.log(`Attempting to delete services with slugs: ${slugsToDelete.join(', ')}`)

    // const { data, error, count } = await supabase
    //     .from('services')
    //     .delete({ count: 'exact' })
    //     .in('slug', slugsToDelete)

    // if (error) {
    //     console.error('Error deleting services:', error)
    //     return
    // }

    // console.log(`Successfully deleted ${count} service(s).`)
}

cleanupServices()
