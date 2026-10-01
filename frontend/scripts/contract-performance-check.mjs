// Invoked ONLY by verify-history-contract, inside its UUID disposable database.
export function verifyContractReadPerformance({sql, as, id, migration}) {
  const views=['aunor_activities','aunor_journeys','aunor_services','aunor_contract_periods'];
  sql(`insert into public.activities(id,created_by,created_by_role,responsible_id,responsible_name,type,title,description)
    select ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'${id(101)}','admin','${id(102)}','Synthetic operator','Grabación','Synthetic '||n,'Synthetic description'
    from generate_series(1,500) n;
    insert into public.activity_date_spans(activity_id,position,start_date,end_date,place)
    select id,1,'2026-04-12','2026-04-12','Synthetic location' from public.activities where id::text like '10000000-%';
    update public.activities set deleted_at=now(),deleted_by='${id(101)}',deletion_reason='Synthetic trash'
    where id::text like '10000000-%' and right(id::text,1)='0';
    analyze public.activities;analyze public.activity_date_spans;`);
  function snapshot(n) {
    return views.map(view => sql(as(n, `select md5(coalesce(jsonb_agg(to_jsonb(v) order by to_jsonb(v)::text),'[]'::jsonb)::text) from public.${view} v;`)));
  }
  function assertDenied(n) {
    sql(as(n,`do $$begin ${views.map(view=>`assert (select count(*)=0 from public.${view});`).join('')} end $$;`));
  }
  function privacy() {
    assertDenied(2);assertDenied(3);
    for(const n of [1,4]) {
      sql(as(n,`do $$begin
        assert not exists(select 1 from public.aunor_activities where id::text like '10000000-%' and right(id::text,1)='0');
        assert not exists(select 1 from public.aunor_journeys where activity_id::text like '10000000-%' and right(activity_id::text,1)='0');
        assert (select count(*)>=450 from public.aunor_activities);
      end $$;`));
      for(const change of ['is_active=false','must_change_password=true']) {
        sql(`update public.profiles set ${change} where id='${id(100+n)}';`);
        assertDenied(n);
        sql(`update public.profiles set is_active=true,must_change_password=false where id='${id(100+n)}';`);
      }
      sql(`update public.app_sessions set revoked_at=now() where session_id='${id(200+n)}';`);
      assertDenied(n);
      sql(`update public.app_sessions set revoked_at=null where session_id='${id(200+n)}';`);
      sql(`update public.app_sessions set started_at=now()-interval '13 hours',expires_at=now()-interval '1 hour' where session_id='${id(200+n)}';`);
      assertDenied(n);
      sql(`update public.app_sessions set started_at=now(),expires_at=now()+interval '12 hours' where session_id='${id(200+n)}';`);
    }
    sql(`do $$begin
      ${views.map(view=>`assert not has_table_privilege('anon','public.${view}','select');assert not has_table_privilege('authenticated','public.${view}','update');`).join('')}
      assert not exists(select 1 from information_schema.columns where table_name='aunor_activities' and column_name in ('responsible_id','responsible_name','created_by','operator_opinion'));
    end $$;`);
  }
  function measure() {
    return Object.fromEntries(views.map(view=>{
      const samples=Array.from({length:5},()=>{
        const output=sql(as(1,`explain(analyze,format json) select * from public.${view};`));
        const plan=JSON.parse(output.slice(output.indexOf('['),output.lastIndexOf(']')+1))[0];
        return plan['Execution Time'];
      }).sort((a,b)=>a-b);
      return [view,samples[2]];
    }));
  }
  const before=[1,2,3,4].map(snapshot);
  privacy();
  const baseline=measure();
  sql(migration);
  const after=[1,2,3,4].map(snapshot);
  if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Contract projections changed after optimization');
  privacy();
  console.log('PASS contract projections equivalent for all roles; deleted, inactive, password rotation, revoked and expired sessions denied');
  console.log(JSON.stringify({benchmark:'isolated PostgreSQL, 500 synthetic activities; median of 5, not browser load time',before_ms:baseline,after_ms:measure()}));
}
