"use client";

import { useState } from "react";

import styles from "./room-detail-figma.module.css";

type FigmaRoomGalleryProps = {
  images: string[];
  roomName: string;
};

function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FigmaRoomGallery({ images, roomName }: FigmaRoomGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  function goPrevious() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function goNext() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <div className={styles.galleryRoot}>
      <div className={styles.galleryViewport}>
        <img
          src={images[activeIndex]}
          alt={`${roomName} - imagen ${activeIndex + 1}`}
        />

        <button
          type="button"
          className={`${styles.galleryNav} ${styles.galleryNavLeft}`}
          onClick={goPrevious}
          aria-label="Imagen anterior"
        >
          <ArrowLeft />
        </button>

        <button
          type="button"
          className={`${styles.galleryNav} ${styles.galleryNavRight}`}
          onClick={goNext}
          aria-label="Imagen siguiente"
        >
          <ArrowRight />
        </button>

        <div className={styles.galleryDots}>
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              className={`${styles.galleryDot} ${index === activeIndex ? styles.galleryDotActive : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className={styles.galleryThumbs}>
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            className={`${styles.galleryThumb} ${index === activeIndex ? styles.galleryThumbActive : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Miniatura ${index + 1}`}
          >
            <img src={image} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
