// Temporary debug endpoint - DELETE THIS AFTER DEBUGGING
export async function GET() {
  const envCheck = {
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasGitHubClientId: !!process.env.GITHUB_CLIENT_ID,
    hasGitHubClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    nextAuthSecretFirstChars: process.env.NEXTAUTH_SECRET?.substring(0, 10) || 'undefined',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'undefined',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    allNextKeys: Object.keys(process.env).filter(k => k.includes('NEXT')),
  }

  return Response.json(envCheck)
}
