-- Actualiza el contenido editorial inicial de las cinco experiencias.
-- Se mantiene en content_experience para que siga siendo editable desde el backoffice.
update content_experience
set locale_content = jsonb_set(
  jsonb_set(
    locale_content,
    '{es,summary}',
    to_jsonb(case slug
      when 'bodas-celebraciones' then 'El comienzo de una nueva historia merece un escenario inolvidable.'
      when 'eventos-corporativos' then 'Reúne a tu equipo en un entorno natural donde la tranquilidad inspira nuevas ideas, fortalece la colaboración y transforma cada encuentro en una experiencia única.'
      when 'paseo-laguna' then 'Escápate de la rutina y vive un día diferente en Wakaya, rodeado de naturaleza, tranquilidad y experiencias diseñadas para relajarte, reconectar y disfrutar cada momento.'
      when 'cenas-romanticas' then 'Comparte una velada especial para dos, rodeados por la naturaleza y la tranquilidad de Wakaya, en un ambiente donde cada instante invita a celebrar el amor y crear recuerdos inolvidables.'
      when 'gastronomia-local' then 'Disfruta de una experiencia gastronómica rodeada de naturaleza, donde cada plato se complementa con la tranquilidad, el encanto y la hospitalidad de Wakaya.'
    end::text)
  ),
  '{es,body}',
  to_jsonb(case slug
    when 'bodas-celebraciones' then 'En Wakaya, la naturaleza se convierte en el escenario perfecto para celebrar el amor. Nuestro equipo te acompaña con una coordinación personalizada, cuidando cada detalle para que tú y tus invitados vivan un encuentro con lo mágico.'
    when 'eventos-corporativos' then 'En Wakaya diseñamos y coordinamos cada evento de forma personalizada, adaptando los espacios, la propuesta gastronómica y cada detalle a los objetivos de tu empresa. Creamos el ambiente ideal para impulsar la creatividad, fortalecer el trabajo en equipo y vivir una jornada productiva e inspiradora.'
    when 'paseo-laguna' then 'Nuestro programa Full Day te permite disfrutar de los espacios y servicios de Wakaya en un entorno único. La disponibilidad, los horarios y las actividades incluidas se coordinan según la fecha de tu visita para brindarte una experiencia personalizada.'
    when 'cenas-romanticas' then 'Cada cena se diseña de forma personalizada, cuidando la propuesta gastronómica, la ambientación y cada detalle para que vivan una experiencia íntima y exclusiva, donde el encanto de Wakaya haga de esa noche un verdadero encuentro con lo mágico.'
    when 'gastronomia-local' then 'Nuestro restaurante recibe tanto a huéspedes como a visitantes. Consulta los horarios de atención, la disponibilidad y la propuesta gastronómica para la fecha de tu visita.'
  end::text)
)
where slug in ('bodas-celebraciones', 'eventos-corporativos', 'paseo-laguna', 'cenas-romanticas', 'gastronomia-local');

-- La cabecera también permanece dentro del documento editable del Home.
update home_content_revision
set document = (
  select jsonb_set(
    document,
    '{sections}',
    jsonb_agg(
      case when section->>'type' = 'experiences' then
        jsonb_set(
          jsonb_set(section, '{content,eyebrow,es}', to_jsonb('Servicios'::text)),
          '{content,title,es}',
          to_jsonb('Experiencias diseñadas para descansar, celebrar, compartir y conectar con la naturaleza.'::text)
        )
      else section end
      order by position
    )
  )
  from jsonb_array_elements(document->'sections') with ordinality as sections(section, position)
)
where document->'sections' @> '[{"type":"experiences"}]'::jsonb;
