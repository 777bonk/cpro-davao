import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const galleryItems = [
    {
      image: "https://images.unsplash.com/photo-1685023911870-12430a741d41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBzcG9ydHMlMjBjYXIlMjBuaWdodHxlbnwxfHx8fDE3NjEyMDgzMjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Ferrari 488 GTB",
      subtitle: "Full Ceramic Coating - Gold Package",
    },
    {
      image: "https://images.unsplash.com/photo-1646012656811-d6c6b0be5d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMGx1eHVyeSUyMGNhciUyMHJlZmxlY3Rpb258ZW58MXx8fHwxNzYxMjA4MzIxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Mercedes-Benz S-Class",
      subtitle: "Platinum Package + PPF",
    },
    {
      image: "https://images.unsplash.com/photo-1629320029146-72ec6e79c7ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGx1eHVyeSUyMGNhciUyMHNob3dyb29tfGVufDF8fHx8MTc2MTIwODMyMnww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Porsche 911",
      subtitle: "Matte PPF Installation",
    },
    {
      image: "https://images.unsplash.com/photo-1652368688249-39c6ff353e04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjBzcG9ydHMlMjBjYXIlMjBnYXJhZ2V8ZW58MXx8fHwxNzYxMjA4MzIyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Audi R8",
      subtitle: "Ceramic Coating - Silver Package",
    },
    {
      image: "https://images.unsplash.com/photo-1695029502107-9fd205276f1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBnbG9zc3klMjBjZXJhbWljJTIwY29hdGluZ3xlbnwxfHx8fDE3NjEyMDgzMTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "BMW M4",
      subtitle: "Complete Detailing + Coating",
    },
    {
      image: "https://images.unsplash.com/photo-1606235994317-b517abfd89cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBwYWludCUyMHByb3RlY3Rpb24lMjBmaWxtfGVufDF8fHx8MTc2MTIwODMyMXww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Tesla Model 3",
      subtitle: "Gold Package - Ceramic Coating",
    },
  ];

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % galleryItems.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? galleryItems.length - 1 : selectedImage - 1);
    }
  };

  return (
    <section id="gallery" className="scroll-mt-20 py-24 bg-gradient-to-b from-[#0f0f0f] to-[#0A0A0A] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#E41E6A] tracking-wider text-sm">OUR WORK</span>
          <h2 className="text-4xl md:text-5xl text-white mt-4 mb-6">
            Gallery of Excellence
          </h2>
          <p className="text-[#C0C0C0] text-lg max-w-2xl mx-auto">
            See the transformation and perfection we bring to every vehicle in Davao.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group cursor-pointer overflow-hidden rounded-lg aspect-[4/3]"
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white text-xl mb-1">{item.title}</h3>
                  <p className="text-[#E41E6A] text-sm">{item.subtitle}</p>
                </div>
              </div>

              {/* Border glow effect */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#E41E6A] transition-colors duration-300 rounded-lg" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 text-white hover:text-[#E41E6A] transition-colors duration-200 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X size={32} />
            </button>

            {/* Navigation Buttons */}
            <button
              className="absolute left-6 text-white hover:text-[#E41E6A] transition-colors duration-200 z-10"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <ChevronLeft size={48} />
            </button>

            <button
              className="absolute right-6 text-white hover:text-[#E41E6A] transition-colors duration-200 z-10"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight size={48} />
            </button>

            {/* Image */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-5xl max-h-[85vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryItems[selectedImage].image}
                alt={galleryItems[selectedImage].title}
                className="w-full h-full object-contain rounded-lg"
              />
              
              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 rounded-b-lg">
                <h3 className="text-white text-2xl mb-1">
                  {galleryItems[selectedImage].title}
                </h3>
                <p className="text-[#E41E6A]">
                  {galleryItems[selectedImage].subtitle}
                </p>
              </div>
            </motion.div>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white">
              {selectedImage + 1} / {galleryItems.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
