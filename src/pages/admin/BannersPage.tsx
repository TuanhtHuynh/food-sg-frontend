import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  updateBannerWithImage,
  useCreate,
  useDelete,
  useList,
  useUpdate,
} from "../../api/queries";
import type { BannerValues } from "../../api/schemas";
import { bannerSchema } from "../../api/schemas";
import type { Banner } from "../../api/types";
import type { Column } from "../../components/DataTable";
import { TextField } from "../../components/form";
import { ResourceTable } from "../../components/ResourceTable";
import { Button, Modal } from "../../components/ui";
import {
  errorMessage,
  formatDate,
  imageUrl,
  mapServerErrors,
} from "../../lib/client";
import { useSearch } from "../../lib/hooks";

/** Đáp ứng BE: image là FILE upload (jpg/jpeg/png/webp, ≤ 2MB); các field còn lại JSON. */
function buildBannerForm(
  values: BannerValues,
  imageFile: File | null,
  isUpdate: boolean,
): FormData {
  const form = new FormData();
  form.append("title", values.title ?? "");
  form.append("link_url", values.link_url ?? "");
  form.append("sort_order", String(Number(values.sort_order || 0)));
  if (imageFile) form.append("image", imageFile);
  if (isUpdate) form.append("_method", "PUT");
  return form;
}

function BannerForm({
  banner,
  onClose,
  existingBanners = [],
}: {
  banner: Banner | null;
  onClose: () => void;
  existingBanners?: Banner[];
}) {
  const create = useCreate<Banner>("banners");
  const update = useUpdate<Banner>("banners");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    watch: watchForm,
    formState: { errors, isSubmitting },
  } = useForm<BannerValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title ?? "",
      link_url: banner?.link_url ?? "",
      sort_order: banner ? Number(banner.sort_order) : 1,
      image: null,
    },
  });

  const watchedImage = watchForm("image" as never) as unknown as File | null;
  useEffect(() => {
    if (watchedImage instanceof File) {
      const url = URL.createObjectURL(watchedImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(banner?.image ? imageUrl(banner.image) : null);
  }, [watchedImage, banner]);

  const onSubmit: SubmitHandler<BannerValues> = async (
    values: BannerValues,
  ) => {
    setError("");
    const hasImage = Boolean(imageFile);
    const formData = buildBannerForm(values, imageFile, Boolean(banner));
    try {
      if (banner) {
        if (hasImage) {
          // Banner update với ảnh: gửi POST + _method=PUT (PHP không parse multipart PUT)
          await updateBannerWithImage(banner.id, formData);
        } else {
          await update.mutateAsync({
            id: banner.id,
            payload: {
              title: values.title || null,
              link_url: values.link_url || null,
              sort_order: Number(values.sort_order || 0),
            },
          });
        }
      } else {
        await create.mutateAsync(formData);
      }
      onClose();
    } catch (err) {
      if (
        !mapServerErrors(err, setFieldError, [
          "title",
          "link_url",
          "sort_order",
        ])
      )
        setError(errorMessage(err));
    }
  };

  return (
    <Modal
      open
      title={banner ? "Cập nhật banner" : "Thêm banner"}
      onClose={onClose}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="gap-1.5 p-1.5"
            aria-label="Hủy"
          >
            <X size={16} />
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="gap-1.5 p-1.5"
            aria-label="Lưu"
          >
            <Save size={16} />
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          register={register}
          name="title"
          label="Tiêu đề"
          error={errors.title?.message}
        />
        <TextField
          register={register}
          name="link_url"
          label="Link đích"
          placeholder="https://..."
          error={errors.link_url?.message}
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">
            Thứ tự (sort_order)
          </span>
          <select
            {...register("sort_order")}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
          >
            <option value={0}>0</option>
            {existingBanners.map((b) => (
              <option key={b.sort_order} value={Number(b.sort_order)}>
                {b.sort_order}
              </option>
            ))}
          </select>
          {errors.sort_order?.message ? (
            <span className="text-xs text-rose-600">
              {errors.sort_order.message}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">
            Ảnh banner (jpg/png/webp, ≤ 2MB)
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            {...register("image")}
            onChange={(e) => {
              register("image").onChange(e);
              setImageFile(e.target.files?.[0] ?? null);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
          />
          <span className="text-xs text-slate-400">
            {imageFile?.name ??
              (previewUrl ? "Đang dùng ảnh hiện tại" : "Chưa chọn ảnh")}
          </span>
        </label>

        {previewUrl ? (
          <img
            src={previewUrl}
            alt={banner?.title ?? ""}
            style={{
              width: "150px",
              height: "150px",
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        ) : null}

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </Modal>
  );
}

export function BannersPage() {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { text, keyword, setText } = useSearch();
  const remove = useDelete("banners");
  const query = useList<Banner>("banners", {
    q: keyword || undefined,
    page: page + 1,
  });
  const rows = useMemo(() => query.data?.data ?? [], [query.data]);

  const columns = useMemo<Column<Banner>[]>(
    () => [
      {
        id: "image",
        header: "Ảnh",
        cell: (row) =>
          row.image ? (
            <img
              src={imageUrl(row.image) ?? ""}
              alt={row.title ?? ""}
              style={{
                width: "200px",
                height: "200px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      },
      { id: "title", header: "Tiêu đề", cell: (row) => row.title ?? "—" },
      {
        id: "link_url",
        header: "Link",
        cell: (row) =>
          row.link_url ? (
            <a
              href={row.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-600 hover:underline"
            >
              {row.link_url}
            </a>
          ) : (
            "—"
          ),
      },
      { id: "sort_order", header: "Thứ tự", cell: (row) => row.sort_order },
      {
        id: "updated_at",
        header: "Cập nhật",
        cell: (row) => formatDate(row.updated_at),
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Banner</h1>
          <p className="text-sm text-slate-500">
            Quản lý banner phần top của trang chủ
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="gap-1.5 p-1.5"
          aria-label="Thêm banner"
        >
          <Plus size={16} />
        </Button>
      </header>

      {query.isError ? (
        <p className="text-sm text-rose-600">{errorMessage(query.error)}</p>
      ) : null}

      <ResourceTable
        rows={rows}
        columns={columns}
        rowCount={query.data?.meta?.total ?? 0}
        page={page}
        onPageChange={setPage}
        loading={query.isLoading}
        search={text}
        onSearchChange={setText}
        searchPlaceholder="Tìm theo tiêu đề hoặc link..."
        onEdit={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        onDelete={(row) => remove.mutateAsync(row.id)}
        deleteTitle="Xóa banner"
        deleteMessage={(row) =>
          `Bạn có chắc muốn xóa banner "${row.title ?? ""}"?`
        }
        emptyText="Không có banner nào"
      />

      {formOpen ? (
        <BannerForm
          key={editing?.id ?? "new"}
          banner={editing}
          onClose={() => setFormOpen(false)}
          existingBanners={rows}
        />
      ) : null}
    </div>
  );
}
