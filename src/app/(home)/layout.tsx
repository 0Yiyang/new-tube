import HomeLayout from "@/modules/home/ui/layouts/home-layout";
export const dynamic = "force-dynamic"; //-------层层嵌套，最里面的search-input如果是动态渲染，就不需要suspense
interface LayoutProps {
  children: React.ReactNode;
}
const Layout = ({ children }: LayoutProps) => {
  return <HomeLayout>{children}</HomeLayout>;
};
export default Layout;
