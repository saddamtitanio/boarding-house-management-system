import { createClient } from "@/src/app/lib/supabase/server";

export default async function TestPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.from("profiles").select("*");

  console.log(data, error);

  return (
    <pre>
      {JSON.stringify({ data, error }, null, 2)}
    </pre>
  );
}