begin;

alter table public.profiles
  add column if not exists survey_answers jsonb;

alter table public.profiles
  drop constraint if exists profiles_survey_answers_check;

alter table public.profiles
  add constraint profiles_survey_answers_check check (
    survey_answers is null or coalesce((
      survey_source is not null
      and jsonb_typeof(survey_answers) = 'object'
      and jsonb_typeof(survey_answers -> 'goal') = 'string'
      and jsonb_typeof(survey_answers -> 'genre') = 'string'
      and jsonb_typeof(survey_answers -> 'timing') = 'string'
      and jsonb_typeof(survey_answers -> 'priority') = 'string'
      and length(btrim(survey_answers ->> 'goal')) > 0
      and length(btrim(survey_answers ->> 'genre')) > 0
      and length(btrim(survey_answers ->> 'timing')) > 0
      and length(btrim(survey_answers ->> 'priority')) > 0
    ), false)
  );

notify pgrst, 'reload schema';

commit;
