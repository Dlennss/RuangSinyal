type Props = {
  children: React.ReactNode;
};

export function BackgroundAuth({ children }: Props) {
  return (
    <main className="relative flex min-h-svh justify-center overflow-x-hidden overflow-y-auto bg-[#EFFBFF] auth-shell">
      <div className="relative z-10 w-full max-w-[430px] bg-[#EFFBFF] shadow-[0_0_60px_rgba(22,138,242,0.12)] sm:my-5 sm:min-h-[820px] sm:overflow-hidden sm:rounded-[32px]">
        {children}
      </div>
    </main>
  );
}
