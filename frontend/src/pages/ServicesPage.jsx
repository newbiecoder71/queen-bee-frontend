const ServicesPage = () => {
  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-4">Services</h1>

      <p className="text-gray-700 max-w-3xl">
        Queen Bee Quilts offers professional longarm quilting services,
        custom quilting designs, and finishing services to help bring your
        quilt projects to life.
      </p>

      <ul className="mt-6 space-y-2 list-disc list-inside text-gray-700">
        <li>Longarm quilting (edge-to-edge & custom)</li>
        <li>Binding services</li>
        <li>Quilt consultation and design assistance</li>
        <li>Quilt finishing and prep services</li>
      </ul>
    </div>
  );
};

export default ServicesPage;
