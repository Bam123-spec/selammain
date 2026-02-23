
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually load .env.local
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const servicesToCreate = [
    {
        name: 'Driving Practice (1 Hour)',
        slug: 'driving-practice-1hr',
        price: 65,
        description: 'Single 1-hour private driving lesson',
        duration_minutes: 60,
        is_active: true
    },
    {
        name: 'Driving Practice (10 Hours)',
        slug: 'driving-practice-10hr',
        price: 550,
        description: 'Five 2-hour comprehensive lessons',
        duration_minutes: 600,
        is_active: true
    }
]

async function createServices() {
    console.log("Checking for existing services...")

    for (const service of servicesToCreate) {
        // Check if exists
        const { data: existing } = await supabase
            .from('services')
            .select('id, slug')
            .eq('slug', service.slug)
            .single()

        if (existing) {
            console.log(`Service ${service.slug} already exists. Skipping.`)
            continue
        }

        console.log(`Creating service: ${service.name} (${service.slug})...`)
        const { data, error } = await supabase
            .from('services')
            .insert([service])
            .select()

        if (error) {
            console.error(`Error creating ${service.slug}:`, error)
        } else {
            console.log(`Successfully created ${service.slug}!`)
        }
    }
}

createServices()
