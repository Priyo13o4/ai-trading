import type { TourDefinition } from '../types';

/** Account tour — manual only (launched from the Help / checklist launcher). */
export const profileTour: TourDefinition = {
  id: 'profile',
  label: 'Your account',
  description: 'Account, plan, devices & referrals',
  version: 1,
  trigger: 'manual',
  routeMatch: '/profile',
  steps: [
    {
      id: 'account',
      anchor: 'profile.account',
      title: 'Account details',
      body: 'Update your name, email and password, and see when you joined — all in one place.',
      placement: 'right',
      route: '/profile',
    },
    {
      id: 'plan',
      anchor: 'profile.plan',
      title: 'Plan & billing',
      body: 'Check your current plan, trial status and next billing date, or upgrade and manage payment from here.',
      placement: 'left',
    },
    {
      id: 'devices',
      anchor: 'profile.devices',
      title: 'Active devices',
      body: 'See everywhere you are signed in and sign out of any device you no longer recognise.',
      placement: 'left',
    },
    {
      id: 'referral',
      title: 'Invite & earn',
      body: 'Switch to the Referrals section in the sidebar to share your code and earn rewards. That wraps up the tour — explore at your own pace!',
      placement: 'center',
    },
  ],
};
