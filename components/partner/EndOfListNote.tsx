/** Closing marker for the bottom of a short activity list -- gives the
 *  screen an intentional stop instead of trailing into flat empty space
 *  below the last card, which on a tall phone screen otherwise reads as
 *  an unfinished/desktop-style layout rather than a native app screen.
 *  Shared between Home and Activities (same list shape, same ending). */
export function EndOfListNote() {
  return (
    <div className="mt-10 flex flex-col items-center gap-2.5 pb-4 text-center opacity-55">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
      <p className="text-[13px] font-medium">You&apos;re all caught up</p>
    </div>
  );
}
