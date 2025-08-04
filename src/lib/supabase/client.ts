
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://lxsudjnowijjjjloqubq.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4c3Vkam5vd2lqampqbG9xdWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDY4MTksImV4cCI6MjA2ODE4MjgxOX0.UwM-hnhGf2Bbh6_Io_putCvYBDzrZSKVbfRFC34Q5aU"

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
