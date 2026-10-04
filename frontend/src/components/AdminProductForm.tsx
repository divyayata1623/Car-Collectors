import React, { useEffect, useRef, useState } from 'react';

import { productsAPI, adminAPI } from '../api';
import { resolveImageUrl } from '../api/client';

import type { Product, Category } from '../types';

interface AdminProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

/* =========================================================
   CONSTANTS
========================================================= */

const COMMON_BRANDS = [
  'Hot Wheels',
  'Matchbox',
  'Mini GT',
  'Kaido House',
  'Inno64',
  'Majorette',
  'Tomica',
  'Greenlight',
  'Auto World',
  'M2 Machines',
  'Johnny Lightning',
  'Tarmac Works',
];

const COMMON_SCALES = [
  '1:64',
  '1:43',
  '1:24',
  '1:18',
  '1:32',
  '1:12',
];

const COLLECTOR_CONDITIONS = [
  'Mint on Card (MOC)',
  'Near Mint (Carded)',
  'Card Damaged / Creased',
  'Short Card (MOC)',
  'Loose (Mint)',
  'Loose (Played/Worn)',
];

const MAX_IMAGE_SIZE_MB = 10;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

const SectionTitle: React.FC<{
  title: string;
  subtitle?: string;
}> = ({ title, subtitle }) => {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-[#FF6B1A] shadow-[0_0_12px_rgba(255,107,26,0.55)]" />

        <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#F5F7FA]">
          {title}
        </h3>
      </div>

      {subtitle && (
        <p className="mt-2 pl-5 text-xs leading-relaxed text-[#718096]">
          {subtitle}
        </p>
      )}
    </div>
  );
};

const FieldLabel: React.FC<{
  children: React.ReactNode;
  required?: boolean;
}> = ({ children, required }) => {
  return (
    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#8FA0B7]">
      {children}

      {required && (
        <span className="ml-1 text-[#FF6B1A]">*</span>
      )}
    </label>
  );
};

const InputClass = `
  w-full
  rounded-xl
  border
  border-[#273242]
  bg-[#0D141E]
  px-4
  py-3
  text-sm
  text-[#F5F7FA]
  placeholder-[#526176]
  outline-none
  transition-all
  duration-200
  focus:border-[#FF6B1A]
  focus:ring-2
  focus:ring-[#FF6B1A]/10
  hover:border-[#344154]
`;

const ErrorText: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <p className="mt-1.5 text-xs text-red-400">
    {children}
  </p>
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

export const AdminProductForm: React.FC<
  AdminProductFormProps
> = ({ product, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [error, setError] = useState('');

  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string>
  >({});

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [name, setName] = useState(
    product?.name || ''
  );

  const [brand, setBrand] = useState(
    product?.brand || 'Hot Wheels'
  );

  const [series, setSeries] = useState(
    product?.series || ''
  );

  const [model, setModel] = useState(
    product?.model || ''
  );

  const [scale, setScale] = useState(
    product?.scale || '1:64'
  );

  const [color, setColor] = useState(
    product?.color || ''
  );

  const [year, setYear] = useState<string>(
    product?.year ? String(product.year) : ''
  );

  const [price, setPrice] = useState<string>(
    product?.price !== undefined
      ? String(product.price)
      : ''
  );

  const [stockQuantity, setStockQuantity] =
    useState<string>(
      product?.stock_quantity !== undefined
        ? String(product.stock_quantity)
        : '1'
    );

  const [condition, setCondition] = useState(
    product?.condition || 'Mint on Card (MOC)'
  );

  const [categoryId, setCategoryId] = useState(
    product?.category?.id || ''
  );

  const [description, setDescription] = useState(
    product?.description || ''
  );

  const [isActive, setIsActive] = useState<boolean>(
    product?.is_active ?? true
  );

  /* =======================================================
     IMAGE STATE
  ======================================================= */

  const [frontImage, setFrontImage] =
    useState<File | null>(null);

  const [backImage, setBackImage] =
    useState<File | null>(null);

  const [frontPreview, setFrontPreview] =
    useState<string>(
      resolveImageUrl(
        product?.front_package_image_url
      )
    );

  const [backPreview, setBackPreview] =
    useState<string>(
      resolveImageUrl(
        product?.back_package_image_url
      )
    );

  const [isDraggingFront, setIsDraggingFront] =
    useState(false);

  const [isDraggingBack, setIsDraggingBack] =
    useState(false);

  const frontInputRef =
    useRef<HTMLInputElement>(null);

  const backInputRef =
    useRef<HTMLInputElement>(null);

  /* =======================================================
     LOAD CATEGORIES
  ======================================================= */

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response =
        await productsAPI.getCategories();

      setCategories(response.data);
    } catch (err) {
      console.error(
        'Failed to load categories:',
        err
      );
    }
  };

  /* =======================================================
     FILE VALIDATION
  ======================================================= */

  const validateFile = (
    file: File
  ): string | null => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Unsupported format (${file.type}). Allowed: JPG, PNG, WEBP.`;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE_MB * 1024 * 1024
    ) {
      return `File exceeds ${MAX_IMAGE_SIZE_MB}MB size limit.`;
    }

    return null;
  };

  /* =======================================================
     IMAGE SELECT
  ======================================================= */

  const handleImageSelect = (
    file: File,
    type: 'front' | 'back'
  ) => {
    const validationError =
      validateFile(file);

    if (validationError) {
      setFieldErrors((prev) => ({
        ...prev,
        [type]: validationError,
      }));

      return;
    }

    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[type];
      return copy;
    });

    const previewUrl =
      URL.createObjectURL(file);

    if (type === 'front') {
      setFrontImage(file);
      setFrontPreview(previewUrl);
    } else {
      setBackImage(file);
      setBackPreview(previewUrl);
    }
  };

  /* =======================================================
     FILE INPUT
  ======================================================= */

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      handleImageSelect(file, type);
    }
  };

  /* =======================================================
     DRAG & DROP
  ======================================================= */

  const handleDrop = (
    e: React.DragEvent,
    type: 'front' | 'back'
  ) => {
    e.preventDefault();

    if (type === 'front') {
      setIsDraggingFront(false);
    } else {
      setIsDraggingBack(false);
    }

    const file =
      e.dataTransfer.files?.[0];

    if (file) {
      handleImageSelect(file, type);
    }
  };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeImage = (
    type: 'front' | 'back'
  ) => {
    if (type === 'front') {
      setFrontImage(null);
      setFrontPreview('');

      if (frontInputRef.current) {
        frontInputRef.current.value = '';
      }
    } else {
      setBackImage(null);
      setBackPreview('');

      if (backInputRef.current) {
        backInputRef.current.value = '';
      }
    }
  };

  /* =======================================================
     FORM VALIDATION
  ======================================================= */

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name =
        'Car name is required.';
    }

    if (!brand.trim()) {
      errors.brand =
        'Brand is required.';
    }

    if (
      !price ||
      isNaN(Number(price)) ||
      Number(price) < 0
    ) {
      errors.price =
        'Enter a valid price.';
    }

    if (
      !stockQuantity ||
      isNaN(Number(stockQuantity)) ||
      Number(stockQuantity) < 0
    ) {
      errors.stock_quantity =
        'Enter a valid stock quantity.';
    }

    if (
      year &&
      (
        isNaN(Number(year)) ||
        Number(year) < 1900 ||
        Number(year) > 2100
      )
    ) {
      errors.year =
        'Enter a valid year between 1900 and 2100.';
    }

    /* FRONT IMAGE */

    if (!product && !frontImage) {
      errors.front =
        'Front package image is required.';
    } else if (
      product &&
      !frontPreview
    ) {
      errors.front =
        'Front package image is required.';
    }

    /* BACK IMAGE */

    if (!product && !backImage) {
      errors.back =
        'Back package image is required.';
    } else if (
      product &&
      !backPreview
    ) {
      errors.back =
        'Back package image is required.';
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors).length === 0
    );
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError('');

    if (!validateForm()) {
      setError(
        'Please review the highlighted fields and make sure both package images are provided.'
      );

      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend =
        new FormData();

      /* BASIC INFORMATION */

      formDataToSend.append(
        'name',
        name.trim()
      );

      formDataToSend.append(
        'brand',
        brand.trim()
      );

      if (series.trim()) {
        formDataToSend.append(
          'series',
          series.trim()
        );
      }

      if (model.trim()) {
        formDataToSend.append(
          'model',
          model.trim()
        );
      }

      if (scale.trim()) {
        formDataToSend.append(
          'scale',
          scale.trim()
        );
      }

      if (color.trim()) {
        formDataToSend.append(
          'color',
          color.trim()
        );
      }

      if (year.trim()) {
        formDataToSend.append(
          'year',
          year.trim()
        );
      }

      /* PRICE & STOCK */

      formDataToSend.append(
        'price',
        price.toString()
      );

      formDataToSend.append(
        'stock_quantity',
        stockQuantity.toString()
      );

      /* OTHER DETAILS */

      if (condition.trim()) {
        formDataToSend.append(
          'condition',
          condition.trim()
        );
      }

      if (categoryId) {
        formDataToSend.append(
          'category_id',
          categoryId
        );
      }

      if (description.trim()) {
        formDataToSend.append(
          'description',
          description.trim()
        );
      }

      formDataToSend.append(
        'is_active',
        String(isActive)
      );

      /* FRONT IMAGE */

      if (frontImage) {
        formDataToSend.append(
          'front_image',
          frontImage
        );
      }

      /* BACK IMAGE */

      if (backImage) {
        formDataToSend.append(
          'back_image',
          backImage
        );
      }

      /* EDIT EXISTING PRODUCT */

      if (product) {
        if (
          !frontImage &&
          product.front_package_image_url
        ) {
          formDataToSend.append(
            'front_package_image_url',
            product.front_package_image_url
          );
        }

        if (
          !backImage &&
          product.back_package_image_url
        ) {
          formDataToSend.append(
            'back_package_image_url',
            product.back_package_image_url
          );
        }

        await adminAPI.updateProduct(
          product.id,
          formDataToSend
        );

        onSuccess(
          `Car "${name}" updated successfully!`
        );
      } else {
        await adminAPI.createProduct(
          formDataToSend
        );

        onSuccess(
          `New car "${name}" added to inventory successfully!`
        );
      }

      onClose();

    } catch (err: any) {
      console.error(
        'Submit error:',
        err
      );

      const detail =
        err.response?.data?.detail;

      if (typeof detail === 'string') {
        setError(detail);

      } else if (
        Array.isArray(detail)
      ) {
        setError(
          detail
            .map(
              (d) =>
                d.msg ||
                `${d.loc?.join('.')}: invalid`
            )
            .join(', ')
        );

      } else {
        setError(
          'Failed to save product. Please check your connection and try again.'
        );
      }

    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     IMAGE UPLOAD BOX
  ======================================================= */

  const renderImageUpload = (
    type: 'front' | 'back'
  ) => {
    const isFront = type === 'front';

    const preview = isFront
      ? frontPreview
      : backPreview;

    const isDragging = isFront
      ? isDraggingFront
      : isDraggingBack;

    const inputRef = isFront
      ? frontInputRef
      : backInputRef;

    const errorKey = isFront
      ? fieldErrors.front
      : fieldErrors.back;

    return (
      <div>

        {/* Label */}

        <div className="mb-2 flex items-center justify-between gap-3">

          <FieldLabel required>
            {isFront
              ? 'Front Package Side'
              : 'Back Package Side'}
          </FieldLabel>

          <span className="rounded-full border border-[#273242] bg-[#0D141E] px-2.5 py-1 text-[10px] font-semibold text-[#6F8097]">
            {isFront
              ? 'FRONT'
              : 'BACK'}
          </span>

        </div>

        {/* IMAGE PREVIEW */}

        {preview ? (

          <div className="group relative overflow-hidden rounded-2xl border border-[#273242] bg-[#080C12] p-2 shadow-xl">

            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#101722]">

              <img
                src={preview}
                alt={
                  isFront
                    ? 'Front package preview'
                    : 'Back package preview'
                }
                className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* subtle overlay */}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Image side label */}

              <div className="absolute left-3 top-3">

                <span className="rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white backdrop-blur-md">
                  {isFront
                    ? 'FRONT VIEW'
                    : 'BACK VIEW'}
                </span>

              </div>

              {/* Hover actions */}

              <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/70 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">

                <button
                  type="button"
                  onClick={() =>
                    inputRef.current?.click()
                  }
                  className="flex items-center gap-2 rounded-xl bg-[#FF6B1A] px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-[#F45B0A]"
                >

                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>

                  Replace

                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeImage(type)
                  }
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-red-500"
                >

                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>

                  Remove

                </button>

              </div>

            </div>

            {/* Bottom status */}

            <div className="flex items-center justify-between px-2 pb-1 pt-3">

              <span className="text-[11px] font-semibold text-[#6F8097]">
                Package image ready
              </span>

              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                Ready

              </span>

            </div>

          </div>

        ) : (

          /* EMPTY UPLOAD */

          <div
            onDragOver={(e) => {
              e.preventDefault();

              if (isFront) {
                setIsDraggingFront(true);
              } else {
                setIsDraggingBack(true);
              }
            }}

            onDragLeave={() => {
              if (isFront) {
                setIsDraggingFront(false);
              } else {
                setIsDraggingBack(false);
              }
            }}

            onDrop={(e) =>
              handleDrop(e, type)
            }

            onClick={() =>
              inputRef.current?.click()
            }

            className={`
              group
              relative
              flex
              aspect-[4/3]
              cursor-pointer
              flex-col
              items-center
              justify-center
              overflow-hidden
              rounded-2xl
              border-2
              border-dashed
              p-6
              text-center
              transition-all
              duration-300
              ${
                isDragging
                  ? 'border-[#FF6B1A] bg-[#FF6B1A]/10 shadow-[0_0_35px_rgba(255,107,26,0.10)]'
                  : errorKey
                  ? 'border-red-500/60 bg-red-500/5'
                  : 'border-[#273242] bg-[#0D141E]/80 hover:border-[#FF6B1A]/70 hover:bg-[#101923]'
              }
            `}
          >

            {/* glow */}

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,26,0.06),transparent_55%)] opacity-0 transition-opacity group-hover:opacity-100" />

            {/* Icon */}

            <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#273242] bg-[#101722] text-[#66778D] shadow-lg transition-all duration-300 group-hover:border-[#FF6B1A]/40 group-hover:text-[#FF6B1A] group-hover:shadow-[0_0_25px_rgba(255,107,26,0.12)]">

              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>

            </div>

            <div className="relative text-sm font-bold text-[#F5F7FA]">

              Upload{' '}

              {isFront
                ? 'Front'
                : 'Back'}{' '}

              Package Image

            </div>

            <div className="relative mt-1.5 text-xs text-[#718096]">

              Drag & drop or{' '}

              <span className="font-bold text-[#FF6B1A]">
                browse files
              </span>

            </div>

            <div className="relative mt-3 max-w-[230px] text-[10px] leading-relaxed text-[#526176]">

              {isFront
                ? 'Clear photo showing the car together with the front of its card or blister package.'
                : 'Clear photo showing the back of the card, package details, series information and barcode.'}

            </div>

            <div className="relative mt-4 flex items-center gap-2">

              <span className="rounded-md border border-[#273242] bg-[#101722] px-2 py-1 text-[9px] font-bold text-[#607087]">
                JPG
              </span>

              <span className="rounded-md border border-[#273242] bg-[#101722] px-2 py-1 text-[9px] font-bold text-[#607087]">
                PNG
              </span>

              <span className="rounded-md border border-[#273242] bg-[#101722] px-2 py-1 text-[9px] font-bold text-[#607087]">
                WEBP
              </span>

            </div>

          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) =>
            handleFileChange(e, type)
          }
          className="hidden"
        />

        {errorKey && (
          <ErrorText>
            ⚠ {errorKey}
          </ErrorText>
        )}

      </div>
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6">

      <div
        className="
          flex
          max-h-[94vh]
          w-full
          max-w-5xl
          flex-col
          overflow-hidden
          rounded-3xl
          border
          border-[#273242]
          bg-[#090E15]
          shadow-[0_25px_100px_rgba(0,0,0,0.65)]
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="shrink-0 border-b border-[#202A37] bg-[#0B1018] px-5 py-5 sm:px-7">

          <div className="flex items-center justify-between gap-5">

            <div className="flex items-center gap-4">

              {/* Logo icon */}

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#FF6B1A]/30 bg-[#FF6B1A]/10 text-[#FF6B1A] shadow-[0_0_25px_rgba(255,107,26,0.08)]">

                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 4v16m8-8H4"
                  />
                </svg>

              </div>

              <div>

                <div className="flex items-center gap-2">

                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                    Car Collectors
                  </span>

                  <span className="text-[#394657]">
                    /
                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
                    Inventory
                  </span>

                </div>

                <h2 className="mt-1 text-xl font-black tracking-tight text-[#F5F7FA] sm:text-2xl">

                  {product
                    ? 'EDIT DIE-CAST CAR'
                    : 'ADD NEW DIE-CAST CAR'}

                </h2>

                <p className="mt-1 text-xs text-[#718096] sm:text-sm">

                  {product
                    ? 'Update product details, package images and inventory.'
                    : 'Add a new collectible with verified front and back package photos.'}

                </p>

              </div>

            </div>

            {/* Close */}

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-transparent text-[#64748B] transition hover:border-[#273242] hover:bg-[#121923] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >

              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>

            </button>

          </div>

        </div>

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-8 overflow-y-auto p-5 sm:p-7"
        >

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-400">

                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 9v3m0 4h.01M5.5 19h13a1.5 1.5 0 001.3-2.25l-6.5-11.25a1.5 1.5 0 00-2.6 0L4.2 16.75A1.5 1.5 0 005.5 19z"
                  />
                </svg>

              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-red-300">
                  Please check the form
                </p>

                <p className="mt-1 text-sm leading-relaxed text-red-200/80">
                  {error}
                </p>

              </div>

            </div>
          )}

          {/* =================================================
              SECTION 1 — PACKAGE IMAGES
          ================================================= */}

          <section>

            <SectionTitle
              title="Package Images"
              subtitle="Both sides are required. Use clear photos showing the complete car and packaging."
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              {renderImageUpload('front')}

              {renderImageUpload('back')}

            </div>

            {/* Image rule */}

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#273242] bg-[#0D141E] p-3.5">

              <div className="mt-0.5 text-[#FF6B1A]">

                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.7}
                    d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
                  />
                </svg>

              </div>

              <p className="text-[11px] leading-relaxed text-[#718096]">

                <span className="font-bold text-[#A9B5C5]">
                  Collector photo standard:
                </span>{' '}

                Front photo should clearly show the car with
                its card/blister. Back photo should clearly
                show package information, series details and
                barcode. Maximum 10MB per image.

              </p>

            </div>

          </section>

          {/* =================================================
              SECTION 2 — PRODUCT DETAILS
          ================================================= */}

          <section>

            <SectionTitle
              title="Die-Cast Specifications"
              subtitle="Enter the information collectors will see on the product page."
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* CAR NAME */}

              <div className="md:col-span-2">

                <FieldLabel required>
                  Car Name
                </FieldLabel>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. '98 Honda Prelude"
                  className={`${InputClass} ${
                    fieldErrors.name
                      ? 'border-red-500/70'
                      : ''
                  }`}
                />

                {fieldErrors.name && (
                  <ErrorText>
                    {fieldErrors.name}
                  </ErrorText>
                )}

              </div>

              {/* BRAND */}

              <div>

                <FieldLabel required>
                  Brand
                </FieldLabel>

                <input
                  type="text"
                  list="brand-suggestions"
                  value={brand}
                  onChange={(e) =>
                    setBrand(e.target.value)
                  }
                  placeholder="Hot Wheels, Matchbox, Mini GT..."
                  className={`${InputClass} ${
                    fieldErrors.brand
                      ? 'border-red-500/70'
                      : ''
                  }`}
                />

                <datalist id="brand-suggestions">

                  {COMMON_BRANDS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      />
                    )
                  )}

                </datalist>

                {fieldErrors.brand && (
                  <ErrorText>
                    {fieldErrors.brand}
                  </ErrorText>
                )}

              </div>

              {/* SERIES */}

              <div>

                <FieldLabel>
                  Series / Collection
                </FieldLabel>

                <input
                  type="text"
                  value={series}
                  onChange={(e) =>
                    setSeries(e.target.value)
                  }
                  placeholder="e.g. Factory Fresh, Premium, Boulevard"
                  className={InputClass}
                />

              </div>

              {/* MODEL */}

              <div>

                <FieldLabel>
                  Model / Number
                </FieldLabel>

                <input
                  type="text"
                  value={model}
                  onChange={(e) =>
                    setModel(e.target.value)
                  }
                  placeholder="e.g. JJK53, 05/05, Collector #124"
                  className={InputClass}
                />

              </div>

              {/* SCALE */}

              <div>

                <FieldLabel>
                  Scale
                </FieldLabel>

                <select
                  value={scale}
                  onChange={(e) =>
                    setScale(e.target.value)
                  }
                  className={InputClass}
                >

                  {COMMON_SCALES.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}

                  <option value="Other">
                    Other Scale
                  </option>

                </select>

              </div>

              {/* COLOR */}

              <div>

                <FieldLabel>
                  Color / Livery
                </FieldLabel>

                <input
                  type="text"
                  value={color}
                  onChange={(e) =>
                    setColor(e.target.value)
                  }
                  placeholder="e.g. Spectraflame Orange, Metallic Blue"
                  className={InputClass}
                />

              </div>

              {/* YEAR */}

              <div>

                <FieldLabel>
                  Release / Model Year
                </FieldLabel>

                <input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setYear(e.target.value)
                  }
                  placeholder="2026"
                  min="1900"
                  max="2100"
                  className={`${InputClass} ${
                    fieldErrors.year
                      ? 'border-red-500/70'
                      : ''
                  }`}
                />

                {fieldErrors.year && (
                  <ErrorText>
                    {fieldErrors.year}
                  </ErrorText>
                )}

              </div>

              {/* CONDITION */}

              <div>

                <FieldLabel>
                  Card / Package Condition
                </FieldLabel>

                <select
                  value={condition}
                  onChange={(e) =>
                    setCondition(e.target.value)
                  }
                  className={InputClass}
                >

                  {COLLECTOR_CONDITIONS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* CATEGORY */}

              <div>

                <FieldLabel>
                  Category
                </FieldLabel>

                <select
                  value={categoryId}
                  onChange={(e) =>
                    setCategoryId(e.target.value)
                  }
                  className={InputClass}
                >

                  <option value="">
                    General / Uncategorized
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* PRICE */}

              <div>

                <FieldLabel required>
                  Selling Price
                </FieldLabel>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#718096]">
                    ₹
                  </span>

                  <input
                    type="number"
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value)
                    }
                    placeholder="179"
                    step="0.01"
                    min="0"
                    className={`${InputClass} pl-9 font-semibold ${
                      fieldErrors.price
                        ? 'border-red-500/70'
                        : ''
                    }`}
                  />

                </div>

                {fieldErrors.price && (
                  <ErrorText>
                    {fieldErrors.price}
                  </ErrorText>
                )}

              </div>

              {/* STOCK */}

              <div>

                <FieldLabel required>
                  Stock Quantity
                </FieldLabel>

                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) =>
                    setStockQuantity(
                      e.target.value
                    )
                  }
                  placeholder="1"
                  min="0"
                  className={`${InputClass} ${
                    fieldErrors.stock_quantity
                      ? 'border-red-500/70'
                      : ''
                  }`}
                />

                {fieldErrors.stock_quantity && (
                  <ErrorText>
                    {fieldErrors.stock_quantity}
                  </ErrorText>
                )}

              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">

                <FieldLabel>
                  Collector Notes & Description
                </FieldLabel>

                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Add casting details, package condition notes, special features, wheels, tampos, or other collector information..."
                  className={`${InputClass} resize-none`}
                />

              </div>

            </div>

          </section>

          {/* =================================================
              SECTION 3 — STOREFRONT STATUS
          ================================================= */}

          <section>

            <SectionTitle
              title="Storefront Visibility"
              subtitle="Control whether this car is visible to customers."
            />

            <label
              className={`
                flex
                cursor-pointer
                items-center
                justify-between
                gap-5
                rounded-2xl
                border
                p-4
                transition-all
                ${
                  isActive
                    ? 'border-emerald-500/25 bg-emerald-500/5'
                    : 'border-[#273242] bg-[#0D141E]'
                }
              `}
            >

              <div className="flex items-center gap-4">

                <div
                  className={`
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-xl
                    ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-[#151D28] text-[#66778D]'
                    }
                  `}
                >

                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.7}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />

                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      strokeWidth={1.7}
                    />

                  </svg>

                </div>

                <div>

                  <div className="text-sm font-bold text-[#F5F7FA]">
                    Active in Storefront
                  </div>

                  <p className="mt-0.5 text-xs text-[#718096]">

                    {isActive
                      ? 'Customers can currently see and purchase this car.'
                      : 'This car is hidden from the customer storefront.'}

                  </p>

                </div>

              </div>

              {/* CUSTOM SWITCH */}

              <div
                className={`
                  relative
                  h-6
                  w-11
                  shrink-0
                  rounded-full
                  transition-all
                  ${
                    isActive
                      ? 'bg-[#FF6B1A]'
                      : 'bg-[#263141]'
                  }
                `}
              >

                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) =>
                    setIsActive(
                      e.target.checked
                    )
                  }
                  className="sr-only"
                />

                <span
                  className={`
                    absolute
                    top-1
                    h-4
                    w-4
                    rounded-full
                    bg-white
                    shadow-md
                    transition-all
                    ${
                      isActive
                        ? 'left-6'
                        : 'left-1'
                    }
                  `}
                />

              </div>

            </label>

          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-[#202A37] bg-[#090E15]/95 px-5 py-4 backdrop-blur-xl sm:-mx-7 sm:-mb-7 sm:px-7">

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">

              {/* CANCEL */}

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="
                  rounded-xl
                  border
                  border-[#273242]
                  bg-[#0D141E]
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-[#A9B5C5]
                  transition-all
                  hover:border-[#3A4759]
                  hover:bg-[#121923]
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Cancel
              </button>

              {/* SAVE / UPDATE */}

              <button
                type="submit"
                disabled={isLoading}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-[#FF6B1A]
                  to-[#F0540A]
                  px-7
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_8px_25px_rgba(255,107,26,0.20)]
                  transition-all
                  hover:scale-[1.01]
                  hover:shadow-[0_10px_35px_rgba(255,107,26,0.28)]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  disabled:hover:scale-100
                "
              >

                {isLoading ? (

                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    <span>
                      Saving Car...
                    </span>
                  </>

                ) : (

                  <>

                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />

                    </svg>

                    <span>
                      {product
                        ? 'Update Car'
                        : 'Save & Add Car'}
                    </span>

                  </>

                )}

              </button>

            </div>

          </div>

        </form>

      </div>

    </div>
  );
};

export default AdminProductForm;
