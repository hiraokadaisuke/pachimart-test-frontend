interface SupabaseSelectResponse<T> {
  data: T[] | null;
  error: Error | null;
}

interface SupabaseTableClient<T> {
  select: (columns?: string) => Promise<SupabaseSelectResponse<T>>;
}

interface SupabaseClientLike {
  from: <T>(table: string) => SupabaseTableClient<T>;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClientLike | null =
  supabaseUrl && supabaseKey
    ? {
        from: <T>(table: string) => ({
          select: async (columns = "*"): Promise<SupabaseSelectResponse<T>> => {
            try {
              const response = await fetch(
                `${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(columns)}`,
                {
                  headers: {
                    apikey: supabaseKey,
                    Authorization: `Bearer ${supabaseKey}`,
                    Prefer: "return=representation",
                  },
                },
              );

              if (!response.ok) {
                const message = await response.text();
                return { data: null, error: new Error(message || "Failed to fetch Supabase data") };
              }

              const data = (await response.json()) as T[];
              return { data, error: null };
            } catch (error) {
              return { data: null, error: error as Error };
            }
          },
        }),
      }
    : null;
