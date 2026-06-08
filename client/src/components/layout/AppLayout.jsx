import BottomNav from "./BottomNav";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell pb-20">
      {children}
      <BottomNav />
    </div>
  );
}