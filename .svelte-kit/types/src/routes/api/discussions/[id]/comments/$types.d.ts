import type * as Kit from '@sveltejs/kit';

interface RouteParams extends Partial<Record<string, string>> { id: string }

export type RequestHandler = Kit.RequestHandler<RouteParams>;
export type RequestEvent = Kit.RequestEvent<RouteParams>;