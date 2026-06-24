"use client";

// Create a new catalog group: name + its extra-variable slots, defined up
// front (and editable later on the group's Parameters tab).

import { useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { createCatalogGroup, type CustomCatalogGroup } from "@/lib/custom-catalogs";
import type { ExtraSlot } from "@/lib/catalog-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExtraSlotsEditor } from "./extra-slots-editor";

export function NewCatalogDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (group: CustomCatalogGroup) => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [slots, setSlots] = useState<ExtraSlot[]>([]);

  const create = async () => {
    try {
      const group = await createCatalogGroup(name, slots);
      setName("");
      setSlots([]);
      onCreated(group);
    } catch (e) {
      console.error("Failed to create catalog group:", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("admin.catUi.newCatalog")}</DialogTitle>
          <DialogDescription>
            {t("admin.catUi.newCatalogDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400">
              {t("admin.common.name")}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("admin.catUi.namePlaceholder")}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wider text-gray-400">
              {t("admin.catUi.extraVariables")}
            </label>
            <ExtraSlotsEditor value={slots} onChange={setSlots} />
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("admin.common.cancel")}
          </Button>
          <Button size="sm" onClick={create} disabled={!name.trim()}>
            {t("admin.catUi.createCatalog")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
