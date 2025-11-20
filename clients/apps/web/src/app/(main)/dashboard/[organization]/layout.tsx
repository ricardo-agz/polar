import { OrganizationContextProvider } from '@/providers/maintainerOrganization'
import { getServerSideAPI } from '@/utils/client/serverside'
import { getOrganizationBySlugOrNotFound } from '@/utils/organization'
import { getUserOrganizations } from '@/utils/user'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'
import { UnauthorizedResponseError } from '@polar-sh/client'

export async function generateMetadata(props: {
  params: Promise<{ organization: string }>
}): Promise<Metadata> {
  const params = await props.params
  let organizationName = params.organization

  try {
    const api = await getServerSideAPI()
    const organization = await getOrganizationBySlugOrNotFound(
      api,
      params.organization,
    )
    organizationName = organization.name
  } catch (error) {
    // In preview environments we may not have authenticated cookies
    // available to server components. Swallow unauthorized errors and
    // fall back to a generic title instead of a 500.
    if (!(error instanceof UnauthorizedResponseError)) {
      throw error
    }
  }

  return {
    title: {
      template: `%s | ${organizationName} | Polar`,
      default: organizationName,
    },
  }
}

export default async function Layout(props: {
  params: Promise<{ organization: string }>
  children: React.ReactNode
}) {
  const params = await props.params

  const { children } = props

  let organization
  let userOrganizations

  try {
    const api = await getServerSideAPI()
    organization = await getOrganizationBySlugOrNotFound(
      api,
      params.organization,
    )
    userOrganizations = await getUserOrganizations(api)
  } catch (error) {
    // On Vercel preview we don't have access to the authenticated
    // session cookie in server components, which causes authenticated
    // API calls to return 401 and previously resulted in a 500.
    // If we're unauthorized, fall back to the top-level dashboard
    // and let the client-side auth flow handle things.
    if (error instanceof UnauthorizedResponseError) {
      return redirect('/dashboard')
    }
    throw error
  }

  if (!userOrganizations.some((org) => org.id === organization.id)) {
    return redirect('/dashboard')
  }

  return (
    <OrganizationContextProvider
      organization={organization}
      organizations={userOrganizations}
    >
      {children}
    </OrganizationContextProvider>
  )
}
