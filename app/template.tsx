import SplashScreen from "@/components/shared/SplashScreen";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      {children}
    </>
  );
}
