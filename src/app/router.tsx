import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { BottomNav } from './App';

// Page components
import LandingPageDefault        from './routes/index';
import CollectionPageDefault     from './routes/collection';
import CollectionDetailDefault   from './routes/collection.$id';
import AddPageDefault            from './routes/add';
import ScannerPageDefault        from './routes/scanner';
import WishlistPageDefault       from './routes/wishlist';
import StatisticsPageDefault     from './routes/statistics';
import SettingsPageDefault       from './routes/settings';

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <BottomNav />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPageDefault,
});

const collectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collection',
  component: CollectionPageDefault,
});

const collectionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/collection/$id',
  component: CollectionDetailDefault,
});

const wishlistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wishlist',
  component: WishlistPageDefault,
});

const addRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/add',
  component: AddPageDefault,
  validateSearch: (search: Record<string, unknown>) => ({
    q:       (search['q']       as string | undefined) ?? undefined,
    barcode: (search['barcode'] as string | undefined) ?? undefined,
  }),
});

const scannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scanner',
  component: ScannerPageDefault,
});

const statisticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/statistics',
  component: StatisticsPageDefault,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPageDefault,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  collectionRoute,
  collectionDetailRoute,
  wishlistRoute,
  addRoute,
  scannerRoute,
  statisticsRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

