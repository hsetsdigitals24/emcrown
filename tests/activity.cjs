// Node regression: pure filters and real Drizzle SQL against an in-memory transport, never live records.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse installed TypeScript and Drizzle. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { drizzle } = require("drizzle-orm/pg-proxy");
const { activityFilterSchema, activityRange, activityHref, activityCategory } = require("../src/features/activity/filters.ts");
const { readActivity } = require("../src/features/activity/repository.ts");
const org = "11111111-1111-4111-8111-111111111111";
const user = "22222222-2222-4222-8222-222222222222";
const snapshot = "2020-10-30T14:00:00.000Z";
const base = activityFilterSchema.parse({snapshot});
assert.equal(base.page,1);
for (const input of [{period:"custom"}, {period:"custom",from:"2020-02-30",to:"2020-03-01"},
  {period:"custom",from:"2020-10-31",to:"2020-10-30"}, {role:"owner"}, {outcome:"anything"},
  {actorId:"not-a-uuid"}, {actor:"mine",actorId:user}, {action:"DROP TABLE"}, {page:"-1"},
  {page:"1.5"}, {page:["1"]}, {period:["today","all"]}, {snapshot:"2099-01-01T00:00:00.000Z"}, {unexpected:"1"}]) {
  assert.equal(activityFilterSchema.safeParse(input).success,false,JSON.stringify(input));
}
const custom = activityFilterSchema.parse({period:"custom",from:"2020-10-28",to:"2020-10-29"});
assert.equal(activityRange(custom,new Date(snapshot)).start.toISOString(),"2020-10-28T00:00:00.000Z");
assert.equal(activityRange(custom,new Date(snapshot)).end.toISOString(),"2020-10-30T00:00:00.000Z","Through date includes the whole UTC day");
assert.equal(activityRange({...base,period:"today"},new Date(snapshot)).start.toISOString(),"2020-10-30T00:00:00.000Z");
assert.equal(activityRange({...base,period:"week"},new Date(snapshot)).start.toISOString(),"2020-10-23T14:00:00.000Z");
assert.equal(activityCategory("access.denied"),"access");
const next = new URL(activityHref({...base,actor:"mine",outcome:"attention",hideRoutine:"1"},{page:2}),"https://example.test");
assert.equal(next.searchParams.get("snapshot"),snapshot);
assert.equal(next.searchParams.get("actor"),"mine");
assert.equal(next.searchParams.get("page"),"2");
assert.equal(new URL(activityHref(base,{snapshot:undefined,page:1}),"https://example.test").searchParams.has("snapshot"),false);
const queries = [];
const database = drizzle(async (sql,params) => {
  queries.push({sql,params});
  return sql.includes("count(*)") ? {rows:[[130,120,7,3]]} : sql.includes("select distinct") ? {rows:[[user,"fictional@example.test"]]} : {rows:[]};
});
(async () => {
  const page = await readActivity(database,org,user,{snapshot,page:"2",outcome:"attention",actor:"mine",hideRoutine:"1"});
  assert.equal(page.total,130,"Counts cover all matching history, beyond the former 100-event limit");
  assert.equal(page.pageCount,6);
  assert.equal(page.filters.snapshot,snapshot);
  assert.equal(page.filters.page,2);
  assert.equal(queries.length,3);
  assert.equal(page.actors[0].email,"fictional@example.test");
  assert.ok(queries[2].params.includes(org),"Actor choices are organisation scoped");
  for (const query of queries.slice(0,2)) {
    assert.match(query.sql,/"organisation_id" = \$/);
    assert.ok(query.params.includes(org));
    assert.ok(query.params.includes(user));
    assert.ok(query.params.includes("failure") && query.params.includes("denied"));
    assert.ok(query.params.includes("portal.viewed") && query.params.includes("audit.viewed"));
    assert.match(query.sql,/"created_at" < \$/);
    assert.doesNotMatch(query.sql,new RegExp(org),"Tenant ID remains a query parameter");
  }
  assert.match(queries[1].sql,/order by .*"created_at" desc, .*"id" desc/);
  assert.deepEqual(queries[1].params.slice(-2),[25,25],"Bounded page size and deterministic offset");
  queries.length=0;
  const clamped=await readActivity(database,org,user,{snapshot,page:"99999",role:"unknown",actor:"unknown",category:"auth"});
  assert.equal(clamped.filters.page,6,"Out-of-range valid pages clamp to the last matching page");
  assert.match(queries[0].sql,/"actor_role" is null/);
  assert.match(queries[0].sql,/"actor_id" is null/);
  assert.ok(queries[0].params.includes("auth.login"));
  assert.ok(!queries[0].params.includes("ownership.transferred"));
  queries.length=0;
  assert.equal((await readActivity(database,org,user,{page:"bad"})).invalid,true);
  assert.equal(queries.length,0,"Invalid filters never fall back to unfiltered history");
  console.log("Activity checks passed: input rejection, UTC boundaries, snapshot links, full-history totals, tenant-scoped parameterized SQL, actor/category/outcome filters and pagination bounds. Transport is simulated; live database execution is not established.");
})().catch(error=>{console.error(error);process.exitCode=1;});
