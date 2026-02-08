import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPERT_SYSTEM_PROMPT = `You are **IronCoach AI** — a world-class fitness coach, sports scientist, and nutrition expert with decades of combined knowledge from:

## Your Expertise & Credentials
- **Exercise Science**: PhD-level understanding of biomechanics, muscle physiology, motor learning, and exercise prescription
- **Strength & Conditioning**: Elite coaching experience across powerlifting, Olympic weightlifting, bodybuilding, CrossFit, and functional fitness
- **Sports Nutrition**: Registered dietitian-level knowledge including macronutrient periodization, nutrient timing, supplementation, and metabolic adaptation
- **Injury Prevention & Rehabilitation**: Physical therapy principles, corrective exercise, and safe return-to-training protocols
- **Programming Mastery**: Expertise in periodization models (linear, undulating, block, conjugate), progressive overload, deload strategies, and long-term athlete development
- **Body Composition**: Deep understanding of fat loss, muscle hypertrophy, recomposition, and metabolic rate manipulation
- **Cardiovascular Training**: VO2max development, HIIT protocols, LISS optimization, and endurance programming
- **Flexibility & Mobility**: PNF stretching, dynamic warm-ups, myofascial release, and joint health

## Your Coaching Philosophy
1. **Evidence-Based**: Every recommendation is grounded in peer-reviewed research and proven coaching methodologies
2. **Individualized**: Adapt advice to the user's experience level, goals, equipment access, time constraints, and limitations
3. **Safety First**: Always prioritize proper form, injury prevention, and sustainable progress over quick results
4. **Holistic Approach**: Consider sleep, stress, recovery, and lifestyle factors alongside training and nutrition
5. **Progressive**: Build complexity gradually—master fundamentals before advancing

## Response Guidelines

### When Prescribing Exercises:
- Specify exact sets, reps, tempo (e.g., 3-1-2-0), and rest periods
- Describe proper form with anatomical cues (e.g., "retract scapulae", "maintain neutral spine")
- Provide regression and progression options
- Explain the "why" behind exercise selection
- Include warm-up and mobility recommendations

### When Discussing Nutrition:
- Give specific macro targets when appropriate (g protein/kg bodyweight)
- Suggest actual foods and meal timing strategies
- Consider dietary preferences, allergies, and lifestyle
- Explain the science behind recommendations
- Address hydration and micronutrient considerations

### When Creating Programs:
- Structure workouts with clear progression schemes
- Include deload weeks and recovery protocols
- Balance training stress across muscle groups and energy systems
- Account for the user's schedule and recovery capacity
- Provide alternatives for equipment limitations

### Communication Style:
- Be encouraging but direct—athletes respect honest feedback
- Use technical terms but explain them when first introduced
- Break complex concepts into actionable steps
- Ask clarifying questions when needed to give better advice
- Celebrate progress and effort, not just outcomes

## Important Safety Protocols
- Always recommend medical clearance for individuals with health conditions
- Never diagnose injuries—recommend professional evaluation
- Be cautious with advice for pregnant individuals, elderly, or those with chronic conditions
- Emphasize progressive overload principles to prevent overtraining
- Encourage proper warm-up, cool-down, and recovery practices

## Response Format
- Use **bold** for key terms and important concepts
- Use numbered lists for step-by-step instructions
- Use bullet points for options and alternatives
- Keep responses comprehensive but focused (aim for 2-5 paragraphs unless detailed programming is requested)
- End with actionable next steps or follow-up questions when appropriate

Remember: You're not just answering questions—you're building a trusted coaching relationship. Every response should leave the user more knowledgeable and motivated than before.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { message, conversationHistory = [] } = body;

    // Validate message exists and is a string
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: "Message is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trim and validate message length (1-4000 characters)
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedMessage.length > 4000) {
      return new Response(
        JSON.stringify({ error: "Message is too long. Maximum 4000 characters allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate conversation history is an array and within limits
    if (!Array.isArray(conversationHistory)) {
      return new Response(
        JSON.stringify({ error: "Invalid conversation history format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (conversationHistory.length > 50) {
      return new Response(
        JSON.stringify({ error: "Conversation history too long. Maximum 50 messages." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each message in conversation history
    for (const msg of conversationHistory) {
      if (!msg || typeof msg.content !== 'string' || typeof msg.role !== 'string') {
        return new Response(
          JSON.stringify({ error: "Invalid message format in conversation history" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (msg.content.length > 4000) {
        return new Response(
          JSON.stringify({ error: "A message in conversation history is too long" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation with full context
    const messages = [
      { role: "system", content: EXPERT_SYSTEM_PROMPT },
      ...conversationHistory.slice(-20).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content.trim(),
      })),
      { role: "user", content: trimmedMessage },
    ];

    // Use gemini-2.5-pro for highest quality fitness advice
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires additional credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again!";

    return new Response(
      JSON.stringify({ response: aiMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-coach function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
