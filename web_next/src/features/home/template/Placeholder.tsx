'use client';

import { SELECTED_WORK_PLACEHOLDER, WORKFLOW_PLACEHOLDER } from './content';
import { Reveal } from './reveal';

/**
 * The design's two holding bands — "WORK FLOW / HOW WE WORK / UNDER
 * DISCUSSION" on navy and "SELECTED WORK" on white, set off-centre as drawn.
 * Dummies, kept word for word until the client designs them.
 */
export function WorkflowPlaceholder() {
  return (
    <section
      data-section="how-we-work"
      className="mt-[2vw] grid h-[56vw] place-items-center bg-navy-800 text-center text-white max-lg:h-[60vw] max-lg:min-h-64"
    >
      <Reveal>
        <h2 className="font-[Inter] text-[4.8vw] font-light leading-[1.1] max-lg:text-[1.875rem]">
          {WORKFLOW_PLACEHOLDER.map((line, n) => (
            <span key={line}>
              {n > 0 && <br />}
              {line}
            </span>
          ))}
        </h2>
      </Reveal>
    </section>
  );
}

export function SelectedWorkPlaceholder() {
  return (
    <section data-section="selected-work" className="pb-[15vw] pt-[9vw]">
      <Reveal>
        <h2 className="ml-[27%] font-[Inter] text-[4.2vw] font-light text-navy-800 max-lg:ml-[3%] max-lg:text-3xl">{SELECTED_WORK_PLACEHOLDER}</h2>
      </Reveal>
    </section>
  );
}
