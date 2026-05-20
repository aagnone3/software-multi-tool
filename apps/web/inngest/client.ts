// The Inngest client and event schemas live in @repo/jobs so that any
// workspace package (notably @repo/api) can dispatch events without
// reaching into apps/web. This file re-exports the client to keep the
// import paths used by the function definitions in this directory stable.
export { inngest } from "@repo/jobs";
