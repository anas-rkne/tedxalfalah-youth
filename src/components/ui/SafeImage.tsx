import Image, { ImageProps } from "next/image";

export default function SafeImage(props: ImageProps) {
  return (
    <Image
      {...props}
      data-safe-image
      style={{
        ...props.style,
        transform: "none",
        rotate: "none",
      }}
    />
  );
}