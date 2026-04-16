import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, MotionValue } from "framer-motion";
import "./HeroParallax.css";

export const HeroParallax = ({
  products,
  onProductClick
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
    draftId: string;
    country?: string;
  }[];
  onProductClick?: (draftId: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), springConfig);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), springConfig);
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springConfig);
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig);
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 500]), springConfig);

  // Divide products into rows safely. If less than 15, loop them.
  const duplicated = [...products, ...products, ...products];
  const firstRow = duplicated.slice(0, 5);
  const secondRow = duplicated.slice(5, 10);
  const thirdRow = duplicated.slice(10, 15);

  return (
    <div
      ref={ref}
      className="hero-parallax-container"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="hero-parallax-matrix"
      >
        <motion.div className="hero-parallax-row">
          {firstRow.map((product, idx) => (
            <ProductCard 
              product={product} 
              translate={translateX} 
              key={`${product.title}-${idx}`} 
              onClick={onProductClick}
            />
          ))}
        </motion.div>
        <motion.div className="hero-parallax-row">
          {secondRow.map((product, idx) => (
            <ProductCard 
              product={product} 
              translate={translateXReverse} 
              key={`${product.title}-${idx}`} 
              onClick={onProductClick}
            />
          ))}
        </motion.div>
        <motion.div className="hero-parallax-row">
          {thirdRow.map((product, idx) => (
            <ProductCard 
              product={product} 
              translate={translateX} 
              key={`${product.title}-${idx}`} 
              onClick={onProductClick}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="hero-parallax-header">
      <h1 className="hero-title">
        Cartographica. <br /> Map the memories.
      </h1>
      <p className="hero-subtitle">
        Design ultra-premium, museum-quality maps of the places that matter most to you. Built with open-source rendering.
      </p>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
  onClick
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
    draftId: string;
    country?: string;
  };
  translate: MotionValue<number>;
  onClick?: (draftId: string) => void;
}) => {
  return (
    <motion.div
      style={{ x: translate }}
      className="hero-parallax-card group"
      onClick={() => onClick?.(product.draftId)}
    >
      <div className="hero-parallax-card-inner">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            className="hero-parallax-image"
            alt={product.title}
          />
        ) : (
          <div className="hero-parallax-placeholder" />
        )}
      </div>
      <div className="hero-parallax-overlay" />
      <h2 className="hero-parallax-card-title">{product.title}</h2>
      {product.country && <p className="hero-parallax-card-subtitle">{product.country}</p>}
    </motion.div>
  );
};
