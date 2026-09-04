import { useState } from "react";
import { useVendaCalc } from "@/hooks/useVendaCalc";
import { STORE_ICONS } from "@/services/stores";
import { cn } from "@/lib/utils";
import type { Store } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Local copy of the shell button style — importing AppShell here would create
 * a circular import (AppShell renders StoreSwitcher). */
function ActionButton({
  children,
  onClick,
  variant = "ghost",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2.5 text-[13px] transition-colors",
        variant === "solid"
          ? "bg-primary font-semibold text-primary-foreground hover:opacity-90"
          : "bg-panel2 font-medium text-foreground ring-1 ring-hairline hover:bg-panel2/70",
        className,
      )}
    >
      {children}
    </button>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STORE_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => onChange(icon)}
          className={cn(
            "grid size-9 place-items-center rounded-lg text-[16px] ring-1 transition-colors",
            value === icon
              ? "bg-primary/15 ring-primary/50"
              : "bg-panel2 ring-hairline hover:bg-panel2/70",
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function CreateStoreDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addStore } = useVendaCalc();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>("🏪");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName("");
          setIcon("🏪");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar nova loja</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block">
            <span className="text-[11px] tracking-wide text-dim uppercase">Nome da loja</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Loja Games"
              className="mt-1.5 w-full rounded-lg bg-panel2 px-3 py-2.5 text-[13px] text-foreground ring-1 ring-hairline outline-none focus:ring-primary/50"
            />
          </label>
          <div>
            <span className="text-[11px] tracking-wide text-dim uppercase">Ícone da loja</span>
            <div className="mt-1.5">
              <IconPicker value={icon} onChange={setIcon} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <ActionButton onClick={() => onOpenChange(false)}>Cancelar</ActionButton>
            <ActionButton
              variant="solid"
              onClick={() => {
                if (!name.trim()) return;
                addStore(name, icon);
                onOpenChange(false);
                setName("");
                setIcon("🏪");
              }}
            >
              Criar loja
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StoreRow({ store }: { store: Store }) {
  const { stores, storeStats, updateStore, duplicateStore, deleteStore } = useVendaCalc();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(store.name);
  const [icon, setIcon] = useState(store.icon);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [askData, setAskData] = useState(false);
  const stats = storeStats(store.id);
  const isLast = stores.length <= 1;

  return (
    <div className="panel-surface space-y-3 p-3">
      {editing ? (
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-panel2 px-3 py-2 text-[13px] text-foreground ring-1 ring-hairline outline-none focus:ring-primary/50"
          />
          <IconPicker value={icon} onChange={setIcon} />
          <div className="flex justify-end gap-2">
            <ActionButton
              onClick={() => {
                setName(store.name);
                setIcon(store.icon);
                setEditing(false);
              }}
            >
              Cancelar
            </ActionButton>
            <ActionButton
              variant="solid"
              onClick={() => {
                updateStore(store.id, { name: name.trim() || store.name, icon });
                setEditing(false);
              }}
            >
              Salvar
            </ActionButton>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <span className="text-[18px] leading-none">{store.icon}</span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">{store.name}</p>
              <p className="num text-[11px] text-mut">
                {stats.products} produtos • {stats.simulations} simulações
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton className="px-2.5 py-1.5" onClick={() => setEditing(true)}>
              Editar
            </ActionButton>
            <ActionButton className="px-2.5 py-1.5" onClick={() => setAskData(true)}>
              Duplicar
            </ActionButton>
            <ActionButton
              className={cn("px-2.5 py-1.5", isLast && "opacity-40")}
              onClick={() => !isLast && setConfirmDelete(true)}
            >
              Excluir
            </ActionButton>
          </div>
        </>
      )}

      {askData ? (
        <div className="rounded-lg bg-panel2 p-3 text-[12px] text-mut ring-1 ring-hairline">
          <p className="text-foreground">Copiar também produtos e simulações?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <ActionButton
              className="px-2.5 py-1.5"
              onClick={() => {
                duplicateStore(store.id, false);
                setAskData(false);
              }}
            >
              Só configurações
            </ActionButton>
            <ActionButton
              variant="solid"
              className="px-2.5 py-1.5"
              onClick={() => {
                duplicateStore(store.id, true);
                setAskData(false);
              }}
            >
              Copiar tudo
            </ActionButton>
            <ActionButton className="px-2.5 py-1.5" onClick={() => setAskData(false)}>
              Cancelar
            </ActionButton>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="rounded-lg bg-loss/10 p-3 text-[12px] ring-1 ring-loss/30">
          <p className="font-semibold text-loss">ATENÇÃO</p>
          <p className="mt-1 text-mut">
            Você está prestes a excluir a loja: <span className="text-foreground">{store.name}</span>
            . Produtos, simulações e configurações desta loja serão excluídos. Esta ação não poderá
            ser desfeita.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <ActionButton className="px-2.5 py-1.5" onClick={() => setConfirmDelete(false)}>
              Cancelar
            </ActionButton>
            <ActionButton
              variant="solid"
              className="bg-loss px-2.5 py-1.5 text-white"
              onClick={() => {
                setConfirmDelete(false);
                deleteStore(store.id);
              }}
            >
              Excluir loja
            </ActionButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ManageStoresDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { stores } = useVendaCalc();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar lojas</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {stores.map((store) => (
            <StoreRow key={store.id} store={store} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StoreSwitcher() {
  const { stores, activeStore, activeStoreId, setActiveStore } = useVendaCalc();
  const [creating, setCreating] = useState(false);
  const [managing, setManaging] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex max-w-[150px] items-center gap-1.5 rounded-lg bg-panel2 px-2.5 py-1.5 text-[12px] font-medium text-foreground ring-1 ring-hairline hover:bg-panel2/70 sm:max-w-[210px]"
          aria-label="Selecionar loja ativa"
        >
          <span className="text-[14px] leading-none">{activeStore?.icon ?? "🏪"}</span>
          <span className="truncate">{activeStore?.name ?? "Carregando…"}</span>
          <span className="text-dim">▾</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="text-[11px] tracking-wide text-dim uppercase">
            Minhas lojas
          </DropdownMenuLabel>
          {stores.map((store) => (
            <DropdownMenuItem
              key={store.id}
              onSelect={() => setActiveStore(store.id)}
              className={cn(
                "gap-2 text-[13px]",
                store.id === activeStoreId && "bg-primary/10 font-medium",
              )}
            >
              <span className="text-[14px]">{store.icon}</span>
              <span className="flex-1 truncate">{store.name}</span>
              {store.id === activeStoreId ? <span className="text-profit">✓</span> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-[13px]" onSelect={() => setCreating(true)}>
            ＋ Criar nova loja
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-[13px]" onSelect={() => setManaging(true)}>
            ⚙️ Gerenciar lojas
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateStoreDialog open={creating} onOpenChange={setCreating} />
      <ManageStoresDialog open={managing} onOpenChange={setManaging} />
    </>
  );
}
