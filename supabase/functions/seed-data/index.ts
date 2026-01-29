import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Random name generation
const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 
  'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

function getRandomName(): string {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function getRandomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return new Date(start + Math.random() * (end - start));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request has a valid auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's token to verify they're admin
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseUser.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for creating data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get or create a membership plan for the fake members
    let { data: memberships } = await supabase.from('memberships').select('id, price').limit(1);
    
    let membershipId: string;
    let membershipPrice: number;

    if (!memberships || memberships.length === 0) {
      const { data: newMembership, error: membershipError } = await supabase
        .from('memberships')
        .insert({ name: 'Standard', price: 50, duration_months: 1, description: 'Standard monthly membership' })
        .select()
        .single();
      
      if (membershipError) throw membershipError;
      membershipId = newMembership.id;
      membershipPrice = newMembership.price;
    } else {
      membershipId = memberships[0].id;
      membershipPrice = memberships[0].price;
    }

    // 2. Get or create a class for the fake check-ins
    let { data: classes } = await supabase.from('classes').select('id').limit(1);
    
    let classId: string;

    if (!classes || classes.length === 0) {
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({ 
          name: 'Open Gym', 
          start_time: new Date().toISOString(), 
          capacity: 50, 
          duration_min: 60,
          description: 'Open gym session'
        })
        .select()
        .single();
      
      if (classError) throw classError;
      classId = newClass.id;
    } else {
      classId = classes[0].id;
    }

    // 3. Create 30 fake members
    const createdUserIds: string[] = [];
    
    for (let i = 0; i < 30; i++) {
      const email = `demo.member.${Date.now()}.${i}@ironbase.demo`;
      const fullName = getRandomName();
      
      const { data: authUser, error: authCreateError } = await supabase.auth.admin.createUser({
        email,
        password: 'DemoPassword123!',
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authCreateError) {
        console.error('Error creating user:', authCreateError);
        continue;
      }

      if (authUser.user) {
        createdUserIds.push(authUser.user.id);
      }
    }

    // 4. Create memberships to generate ~$50,000 revenue over 6 months
    // We have 30 members. To hit $50k with $50/month membership over 6 months = ~166 membership-months
    // Spread across 6 months with varying counts
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const membershipInserts: Array<{
      user_id: string;
      membership_id: string;
      start_date: string;
      end_date: string;
      status: string;
    }> = [];

    // Create multiple membership periods to spread revenue
    // Each member gets 1-6 months of membership history
    for (const userId of createdUserIds) {
      const monthsActive = Math.floor(Math.random() * 6) + 1; // 1-6 months
      const startMonth = Math.floor(Math.random() * (7 - monthsActive));
      
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - (6 - startMonth));
      startDate.setDate(1);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsActive);

      membershipInserts.push({
        user_id: userId,
        membership_id: membershipId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'active'
      });
    }

    // Add more membership records to reach ~$50k target
    // Current: ~30 members × 3.5 avg months × $50 = $5,250
    // Need: ~$50,000 / $50 = 1000 membership-months
    // Add extra entries for some members
    const extraMembershipsNeeded = Math.floor((50000 / membershipPrice) - (createdUserIds.length * 3.5));
    const extraEntriesPerUser = Math.ceil(extraMembershipsNeeded / createdUserIds.length);

    for (let extra = 0; extra < Math.min(extraEntriesPerUser, 30); extra++) {
      for (const userId of createdUserIds) {
        if (membershipInserts.length >= 1000) break;
        
        const monthOffset = extra + 1;
        const startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - monthOffset);
        startDate.setDate(1);

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        membershipInserts.push({
          user_id: userId,
          membership_id: membershipId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          status: 'active'
        });
      }
    }

    if (membershipInserts.length > 0) {
      const { error: membershipInsertError } = await supabase
        .from('user_memberships')
        .insert(membershipInserts);
      
      if (membershipInsertError) {
        console.error('Error inserting memberships:', membershipInsertError);
      }
    }

    // 5. Create 200 random check-in records (bookings)
    const bookingInserts: Array<{
      user_id: string;
      class_id: string;
      status: string;
      created_at: string;
    }> = [];

    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (let i = 0; i < 200; i++) {
      const randomUserId = createdUserIds[Math.floor(Math.random() * createdUserIds.length)];
      const randomDate = getRandomDate(oneYearAgo, now);

      bookingInserts.push({
        user_id: randomUserId,
        class_id: classId,
        status: 'confirmed',
        created_at: randomDate.toISOString()
      });
    }

    if (bookingInserts.length > 0) {
      const { error: bookingInsertError } = await supabase
        .from('bookings')
        .insert(bookingInserts);
      
      if (bookingInsertError) {
        console.error('Error inserting bookings:', bookingInsertError);
      }
    }

    const totalRevenue = membershipInserts.length * membershipPrice;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          membersCreated: createdUserIds.length,
          membershipRecords: membershipInserts.length,
          estimatedRevenue: `$${totalRevenue.toLocaleString()}`,
          checkInsCreated: bookingInserts.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seed data error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
