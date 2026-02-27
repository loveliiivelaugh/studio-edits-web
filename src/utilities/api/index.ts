import axios from "axios";
import apiConfig from "./api.config.json";
import { supabase } from "./supabase";

const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");
const trimSlashes = (value = "") => value.replace(/^\/+|\/+$/g, "");

const joinUrl = (base: string, path: string) => {
    const root = trimTrailingSlash(base);
    const normalizedPath = trimSlashes(path);
    if (!root) return normalizedPath ? `/${normalizedPath}` : "";
    if (!normalizedPath) return root;
    return `${root}/${normalizedPath}`;
};

const isDev = import.meta.env.MODE === "development";
const hostFromEnv = trimTrailingSlash(import.meta.env.VITE_HOSTNAME || "");
const devHostFromEnv = trimTrailingSlash(import.meta.env.VITE_DEV_HOSTNAME || "");
const rootHost = isDev ? (devHostFromEnv || hostFromEnv) : (hostFromEnv || devHostFromEnv);

const explicitOpenStudioBase = trimTrailingSlash(import.meta.env.VITE_OPENSTUDIO_API_BASE || "");
const openstudioBase = explicitOpenStudioBase
    ? explicitOpenStudioBase
    : rootHost.endsWith("/api/v1/openstudio")
        ? rootHost
        : joinUrl(rootHost, "/api/v1/openstudio");

const explicitBurstyBase = trimTrailingSlash(import.meta.env.VITE_BURSTY_BASE || "");
const burstyBase = explicitBurstyBase
    ? explicitBurstyBase
    : rootHost
        ? joinUrl(rootHost, "/woodward-studio/bursty")
        : "";

const baseHeaders = { ...apiConfig.host.headers };
if (import.meta.env.VITE_MASTER_API_KEY) {
    baseHeaders.Authorization = `Bearer ${import.meta.env.VITE_MASTER_API_KEY}`;
}

const baseHostConfig = {
    ...apiConfig.host,
    headers: baseHeaders,
    baseURL: rootHost,
};

const client = axios.create(baseHostConfig);
const openstudioClient = axios.create({
    ...baseHostConfig,
    baseURL: openstudioBase,
});
const burstyClient = axios.create({
    ...baseHostConfig,
    baseURL: burstyBase,
});
const graphqlClient = axios.create(baseHostConfig);

const apiBases = {
    rootHost,
    openstudioBase,
    burstyBase,
};

type PayloadTypes = {
    QueryPayload: Record<string, unknown>;
    MutatePayload: Record<string, unknown> & {
        options?: {
            debounce?: number
        }
    }
};

type SupabaseQueryOptions = {
    table: string;
    select?: string;
    operate?: string;
    filter?: {
        column: string;
        value: number;
    }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type QueryPath = string | ((paths: typeof apiConfig.paths) => string);

const queryPathCallback = (queryPath: QueryPath): string => {
    if (typeof queryPath === "function") return queryPath(apiConfig.paths);
    return queryPath;
};
// general app queries
const queries = ({
    /**
     * General Query to use any query with a passed queryPath
     * @param {string} queryPath Path to the rest API
     * @param {any} [payload] Payload to send with the query
     * @param {string} [method] HTTP method to use, defaults to "get"
     * @returns {import("react-query").UseQueryOptions} An object suitable for use with the `useQuery` hook
     */
    query: (queryPath: QueryPath, payload?: PayloadTypes["QueryPayload"], method?: string) => ({
        queryKey: [queryPath],
        queryFn: async () => {
            const normalizedMethod = (method || (payload ? "post" : "get")).toLowerCase();
            const response = await client.request({
                method: normalizedMethod,
                url: queryPathCallback(queryPath),
                ...(payload ? { data: payload } : {}),
            });
            return response.data;
        },
        options: {
            retries: 2
        }
    }),
    mutate: (queryPath: QueryPath) => ({
        mutationKey: [queryPath],
        mutationFn: async (payload?: PayloadTypes["MutatePayload"]) => {
            if (payload?.options?.debounce) {
                await delay(payload.options.debounce);
            }
            const response = await client.post(queryPathCallback(queryPath), payload);
            return response.data;
        },
        options: {
            retries: 2
        }
    }),

    supabaseQuery: (options: SupabaseQueryOptions) => ({
        queryKey: [`supabase-${options.table}-${options.select}`],
        queryFn: async () => await supabase
            .from(options.table)
            .select(options?.select ? options.select : "*")
            ?.eq(options?.filter?.column || "", options?.filter?.value || "")
    }),
    supabaseMutation: (options: SupabaseQueryOptions) => ({
        mutationKey: [`supabase-mutate-${options.table}`],
        mutationFn: async (payload: Record<string, unknown> & { table?: string; operation?: string }) => {
            const table = payload?.table;
            const operation = payload?.operation;

            if (payload?.table) delete payload.table;
            if (payload?.operation) delete payload.operation;

            // payload = payload.map((item: any) => {
            //     delete item.table;
            //     delete item.operation;
            //     return item;
            // });

            const query = supabase.from(table || options.table);
            switch (operation || "insert") {
                case "upsert":
                    return await query.upsert(payload).select();
                case "update":
                    return await query.update(payload).select();
                case "delete":
                    return await query.delete().select();
                default:
                    return await query.insert(payload).select();
            }
        }
    }),
    /**
     * Queries the GraphQL API
     * @param {string} queryPath Path to the GraphQL API
     * @returns {import("react-query").UseQueryOptions} An object suitable for use with the `useQuery` hook
     */
    graphQuery: (query: string) => ({
        queryKey: ["graphql", query],
        queryFn: async () => graphqlClient.post(query),
    }),
});

const paths = apiConfig.paths;
export { client, openstudioClient, burstyClient, apiBases, paths, queries };
