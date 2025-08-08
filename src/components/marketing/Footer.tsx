const Footer = () => {
  return (
    <footer className="border-t py-10">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} StoxieX. All rights reserved.</p>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
