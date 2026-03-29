import type { PriceResult } from "@/src/types/PriceResult";
import type { Promotion } from "@/src/types/Promotion";
import type { ValidationResult } from "@/src/types/ValidationResult";

const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const toSafeNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizePromotion = (p?: Promotion): Promotion => {
  if (!p) return { type: "none" };

  switch (p.type) {
    case "2x1":
      return { type: "multi", buy: 2, pay: 1 };

    case "3x2":
      return { type: "multi", buy: 3, pay: 2 };

    case "multi":
      return {
        type: "multi",
        buy: Number(p.buy ?? 0),
        pay: Number(p.pay ?? 0),
      };

    case "percent":
    case "discount":
      return { type: p.type, value: Number(p.value ?? 0) };

    case "none":
    default:
      return { type: "none" };
  }
};

export function toPromotion(id?: string | null): Promotion {
  if (!id || id === "none") {
    return { type: "none" };
  }

  if (id.includes("x")) {
    const [buy, pay] = id.split("x").map(Number);
    if (
      Number.isFinite(buy) &&
      Number.isFinite(pay) &&
      buy > 0 &&
      pay > 0 &&
      pay <= buy
    ) {
      return { type: "multi", buy, pay };
    }
  }

  if (id.endsWith("%")) {
    const value = parseInt(id.replace("%", "").replace("-", ""), 10);
    if (Number.isFinite(value) && value > 0) {
      return { type: "percent", value };
    }
  }

  if (id.includes("€")) {
    const value = parseFloat(id.replace("€", "").replace("-", ""));
    if (Number.isFinite(value) && value > 0) {
      return { type: "discount", value };
    }
  }

  return { type: "none" };
}

export function fromPromotion(promo?: Promotion | null): string {
  if (!promo || promo.type === "none") return "none";

  switch (promo.type) {
    case "multi":
      return `${promo.buy}x${promo.pay}`;
    case "percent":
      return `-${promo.value}%`;
    case "discount":
      return `-${promo.value}€`;
    default:
      return "none";
  }
}

export function getPromotionLabel(promo?: Promotion | null): string {
  if (!promo || promo.type === "none") return "";

  switch (promo.type) {
    case "multi":
      return `${promo.buy}x${promo.pay}`;
    case "percent":
      return `-${promo.value}%`;
    case "discount":
      return `-${promo.value}€`;
    default:
      return "";
  }
}
export function hasPromotion(promo?: Promotion | null): boolean {
  return !!promo && promo.type !== "none";
}

export function validatePromotion(
  promo: Promotion | undefined,
  quantity: number,
  unitPrice: number,
): ValidationResult {
  const p = normalizePromotion(promo);
  const qty = Math.max(0, toSafeNumber(quantity));
  const price = Math.max(0, toSafeNumber(unitPrice));

  switch (p.type) {
    case "none":
      return { valid: true };

    case "multi":
      if (p.buy <= 0 || p.pay <= 0 || p.pay > p.buy) {
        return { valid: false, message: "Oferta inválida" };
      }
      return qty >= p.buy
        ? { valid: true }
        : { valid: false, message: `Min ${p.buy}` };

    case "percent":
      if (p.value <= 0 || p.value > 100) {
        return { valid: false, message: "Descuento inválido" };
      }
      return price > 0
        ? { valid: true }
        : { valid: false, message: "Precio inválido" };

    case "discount": {
      const baseTotal = quantity * unitPrice;

      if (promo.value <= 0) {
        return { valid: false, message: "Descuento inválido" };
      }

      if (promo.value > baseTotal) {
        return {
          valid: false,
          message: "El descuento supera el total",
        };
      }

      return { valid: true };
    }
  }
}

function applyPromotion(
  promo: Promotion,
  quantity: number,
  unitPrice: number,
): number {
  const base = quantity * unitPrice;

  switch (promo.type) {
    case "multi": {
      const groups = Math.floor(quantity / promo.buy);
      const remainder = quantity % promo.buy;

      const payableUnits = groups * promo.pay + remainder;
      return payableUnits * unitPrice;
    }

    case "percent":
      return base * (1 - promo.value / 100);

    case "discount":
      return Math.max(0, base - promo.value);

    case "none":
    default:
      return base;
  }
}

export function calculateItemPrice(input: {
  quantity?: number;
  unitPrice?: number;
  promo?: Promotion;
}): PriceResult & {
  promo: Promotion;
  promoLabel: string;
} {
  const quantity = Math.max(0, toSafeNumber(input.quantity));
  const unitPrice = Math.max(0, toSafeNumber(input.unitPrice));
  const promo = normalizePromotion(input.promo);

  const baseTotal = round2(quantity * unitPrice);
  const validation = validatePromotion(promo, quantity, unitPrice);

  if (!validation.valid) {
    return {
      baseTotal,
      total: baseTotal,
      savings: 0,
      valid: false,
      reason: validation.message,
      promo,
      promoLabel: getPromotionLabel(promo),
    };
  }

  const total = round2(applyPromotion(promo, quantity, unitPrice));
  const savings = round2(baseTotal - total);

  return {
    baseTotal,
    total,
    savings,
    valid: true,
    promo,
    promoLabel: getPromotionLabel(promo),
  };
}
