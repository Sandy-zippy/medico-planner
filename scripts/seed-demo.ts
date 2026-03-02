/**
 * Seed demo data for cofounder walkthrough.
 * Run: npx tsx scripts/seed-demo.ts <user-email>
 */

import { createClient } from '@supabase/supabase-js';
import { generateMockOutput } from '../src/lib/mock-engine';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_PROJECTS = [
  {
    clinic_type: 'dental',
    province: 'ON',
    city: 'Toronto',
    area_sqft: 2400,
    notes: 'Dr. Patel — 4 operatory dental clinic, ground floor strip mall',
    existing_space: true,
    address: '1200 Bloor St W, Toronto, ON',
  },
  {
    clinic_type: 'veterinary',
    province: 'BC',
    city: 'Vancouver',
    area_sqft: 3200,
    notes: 'West Side Animal Hospital — full-service vet clinic with surgery',
    existing_space: true,
    address: '4th Ave, Kitsilano, Vancouver, BC',
  },
  {
    clinic_type: 'optometry',
    province: 'AB',
    city: 'Calgary',
    area_sqft: 1800,
    notes: 'ClearVision Optometry — 2 exam rooms + optical dispensary',
    existing_space: true,
    address: '17th Ave SW, Calgary, AB',
  },
  {
    clinic_type: 'physiotherapy',
    province: 'ON',
    city: 'Ottawa',
    area_sqft: 2800,
    notes: 'Peak Performance Physio — open gym concept with hydrotherapy',
    existing_space: false,
    address: 'Bank St, Ottawa, ON',
  },
];

async function seed() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx tsx scripts/seed-demo.ts <user-email>');
    process.exit(1);
  }

  // Find or create user
  const { data: users } = await supabase.auth.admin.listUsers();
  let user = users?.users?.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) {
      console.error('Failed to create user:', error.message);
      process.exit(1);
    }
    user = data.user;
    console.log(`Created user: ${email}`);
  } else {
    console.log(`Found existing user: ${email}`);
  }

  console.log(`\nSeeding ${DEMO_PROJECTS.length} demo projects...\n`);

  for (const demo of DEMO_PROJECTS) {
    // Create project
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        clinic_type: demo.clinic_type,
        province: demo.province,
        city: demo.city,
        area_sqft: demo.area_sqft,
        notes: demo.notes,
        existing_space: demo.existing_space,
        address: demo.address,
        rooms_json: [],
        upload_urls: [],
        budget_range: '',
        timeline: '',
        status: 'in_progress',
      })
      .select()
      .single();

    if (projErr) {
      console.error(`Failed to create ${demo.clinic_type}:`, projErr.message);
      continue;
    }

    // Generate full output
    const output = generateMockOutput({
      clinic_type: demo.clinic_type,
      province: demo.province,
      city: demo.city,
      area_sqft: demo.area_sqft,
      rooms_json: [],
      existing_space: demo.existing_space,
      address: demo.address,
    });

    // Insert generation
    const { error: genErr } = await supabase.from('generations').insert({
      project_id: project.id,
      version: 1,
      output_json: output,
      status: 'completed',
    });

    if (genErr) {
      console.error(`Failed to create generation for ${demo.clinic_type}:`, genErr.message);
      continue;
    }

    const cost = output.cost_estimate
      ? `$${Math.round(output.cost_estimate.total / 1000)}K`
      : 'N/A';

    console.log(
      `  ${demo.clinic_type.padEnd(14)} | ${demo.city.padEnd(12)} | ${demo.area_sqft} SF | ${cost} est.`
    );
  }

  console.log('\nDone! Your cofounder can log in at medico-planner.vercel.app');
  console.log(`Email: ${email} (magic link login)`);
}

seed().catch(console.error);
