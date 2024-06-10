import exifr from "exifr";

const FILE_READ_DEPLAY = 500;

// 画像リサイズタイプ
export enum ImageResizeType {
  KeepAspectRatio,
  Cover,
  Contain,
  Fit,
}

/**
 * Blob から画像を生成
 */
export const blobToImage = (fileBlob: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const dataURL = reader.result as string;

      //

      getImageOrientation(fileBlob).then((orientation) => {
        const image = new Image();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (image as any).____exif_orientation = orientation;
        image.onload = () => {
          resolve(image);
        };
        image.onerror = () => {
          reject();
        };
        image.src = dataURL;
      });
    };

    setTimeout(() => {
      reader.readAsDataURL(fileBlob);
    }, FILE_READ_DEPLAY);
  });
};

/**
 * リサイズ
 */
export const resizeImage = (
  image: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
  type = ImageResizeType.KeepAspectRatio,
  callback?: (image: HTMLImageElement | null) => void
): HTMLCanvasElement => {
  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d") as CanvasRenderingContext2D;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orientation: number = (image as any).____exif_orientation || 1;
  // const orientation = 1;

  canvas.width = image.width;
  canvas.height = image.height;

  // 向きを補正
  // 1  そのまま
  // 2  上下反転(上下鏡像?)
  // 3  180度回転
  // 4  左右反転
  // 5  上下反転、時計周りに270度回転
  // 6  時計周りに90度回転
  // 7  上下反転、時計周りに90度回転
  // 8  時計周りに270度回転
  switch (orientation) {
    case 3:
      context.rotate(Math.PI);
      context.translate(-image.width, -image.height);
      context.drawImage(image, 0, 0);
      image = canvas;
      canvas = document.createElement("canvas");
      context = canvas.getContext("2d") as CanvasRenderingContext2D;
      break;
    case 6:
      canvas.width = image.height;
      canvas.height = image.width;
      context.rotate(0.5 * Math.PI);
      context.translate(0, -image.height);
      context.drawImage(image, 0, 0);
      image = canvas;
      canvas = document.createElement("canvas");
      context = canvas.getContext("2d") as CanvasRenderingContext2D;
      break;
    case 8:
      canvas.width = image.height;
      canvas.height = image.width;
      context.rotate(1.5 * Math.PI);
      context.translate(-image.width, 0);
      context.drawImage(image, 0, 0);
      image = canvas;
      canvas = document.createElement("canvas");
      context = canvas.getContext("2d") as CanvasRenderingContext2D;
      break;
  }

  // 最適化
  (() => {
    const aspectRatio = image.width / image.height;
    const sourceWidth = Math.max(image.width, image.height);
    const targetWidth = Math.max(width, height);
    let beforeWidth = sourceWidth;

    for (let i = 0; i < 1000; i++) {
      const afterWidth = Math.ceil(beforeWidth * 0.5);
      if (afterWidth < targetWidth) break;

      const canvas2 = document.createElement("canvas");
      canvas2.width = afterWidth;
      canvas2.height = afterWidth / aspectRatio;

      const context2 = canvas2.getContext("2d") as CanvasRenderingContext2D;
      context2.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        canvas2.width,
        canvas2.height
      );

      image = canvas2;

      beforeWidth = afterWidth;
    }
  })();

  if (width > image.width || height > image.height) {
    const scale = Math.min(image.width / width, image.height / height);
    width *= scale;
    height *= scale;
  }

  //
  switch (type) {
    case ImageResizeType.KeepAspectRatio:
      (() => {
        const scale = Math.min(width / image.width, height / image.height);
        canvas.width = Math.floor(image.width * scale);
        canvas.height = Math.floor(image.height * scale);
        context.drawImage(
          image,
          0,
          0,
          image.width,
          image.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
      })();
      break;

    case ImageResizeType.Cover:
      (() => {
        const scale = Math.max(width / image.width, height / image.height);
        const w2 = Math.floor(image.width * scale);
        const h2 = Math.floor(image.height * scale);
        const x2 = Math.round((width - w2) / 2);
        const y2 = Math.round((height - h2) / 2);
        canvas.width = width;
        canvas.height = height;
        context.drawImage(
          image,
          0,
          0,
          image.width,
          image.height,
          x2,
          y2,
          w2,
          h2
        );
      })();
      break;

    case ImageResizeType.Contain:
      (() => {
        const scale = Math.min(width / image.width, height / image.height);
        canvas.width = width;
        canvas.height = height;
        context.drawImage(
          image,
          0,
          0,
          image.width,
          image.height,
          (width - image.width * scale) / 2,
          (height - image.height * scale) / 2,
          image.width * scale,
          image.height * scale
        );
      })();
      break;

    case ImageResizeType.Fit:
      (() => {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(
          image,
          0,
          0,
          image.width,
          image.height,
          0,
          0,
          width,
          height
        );
      })();
      break;

    default:
      if (callback) {
        callback(null);
      }
      break;
  }

  if (callback) {
    const resultImage = new Image();
    resultImage.onload = () => {
      callback(resultImage);
    };
    resultImage.src = canvas.toDataURL();
  }

  return canvas;
};

const getImageOrientation = (fileBlob: Blob): PromiseLike<number> => {
  return new Promise((resolve) => {
    exifr
      .orientation(fileBlob)
      .then((data) => {
        resolve(data as number);
      })
      .catch((err) => {
        console.error(err);
        resolve(1);
      });
  });
};

/** Canvas から Blob を生成 */
export const canvasToBlob = (canvas: HTMLCanvasElement) => {
  return new Promise<Blob>((resolve, reject) => {
    try {
      const type = "image/png";

      const dataUrl = canvas.toDataURL();

      // canvas から DataURL で画像を出力
      // DataURL のデータ部分を抜き出し、Base64からバイナリに変換
      const bin = atob(dataUrl.split(",")[1]);
      // 空の Uint8Array ビューを作る
      const buffer = new Uint8Array(bin.length);
      // Uint8Array ビューに 1 バイトずつ値を埋める
      for (let i = 0; i < bin.length; i++) {
        buffer[i] = bin.charCodeAt(i);
      }
      // Uint8Array ビューのバッファーを抜き出し、それを元に Blob を作る
      const blob = new Blob([buffer.buffer], { type: type });

      resolve(blob);
    } catch (err) {
      reject(err);
    }
  });
};

// ポスタライズ
export const posterize = (
  source: Uint8ClampedArray,
  dest: Uint8ClampedArray,
  width: number,
  height: number,
  level = 5
) => {
  const n = width * height * 4;
  const numLevels = clamp(level, 2, 256);
  const numAreas = 256 / numLevels;
  const numValues = 256 / (numLevels - 1);

  for (let i = 0; i < n; i += 4) {
    dest[i] = numValues * ((source[i] / numAreas) >> 0);
    dest[i + 1] = numValues * ((source[i + 1] / numAreas) >> 0);
    dest[i + 2] = numValues * ((source[i + 2] / numAreas) >> 0);
    dest[i + 3] = source[i + 3];
  }
};
function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}
