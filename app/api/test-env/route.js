// TEMPORARY - DELETE AFTER DEBUGGING
export async function GET() {
  const allEnvKeys = Object.keys(process.env).sort()

  const sensitiveCheck = {
    hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    hasGITHUB_CLIENT_ID: !!process.env.GITHUB_CLIENT_ID,
    hasGITHUB_CLIENT_SECRET: !!process.env.GITHUB_CLIENT_SECRET,
    hasPOSTGRES_URL: !!process.env.POSTGRES_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    totalEnvVars: allEnvKeys.length,
    allKeys: allEnvKeys,
  }

  return Response.json(sensitiveCheck)
}
