import Navbar from "./Navbar";

function Layout({ title, children }) {
  return (
    <>
      <Navbar title={title} />
      <div className="page">{children}</div>
    </>
  );
}

export default Layout;
