export default function FooterMinimal() {
  return (
    <footer className="bg-black text-gray-500 py-3">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs">
        {/* Brand */}
        <div className="mb-2 sm:mb-0 text-center sm:text-left">
          <span className="font-semibold text-white">V-Rent</span>
          <span className="ml-1 text-gray-500">
            © {new Date().getFullYear()}
          </span>
        </div>

        {/* Social links */}
        <div className="flex space-x-3 text-gray-500">
          <a href="#" className="hover:text-blue-400">
            Fb
          </a>
          <a href="#" className="hover:text-pink-400">
            Ig
          </a>
          <a href="#" className="hover:text-white">
            X
          </a>
        </div>
      </div>
    </footer>
  );
}
