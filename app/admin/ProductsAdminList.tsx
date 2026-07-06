"use client";

import React, { useState, Fragment } from "react";
import type { Product } from "@/lib/products";

function formatPrice(price: Product["price"]): string {
  if (typeof price === "number") {
    return `${price} Kč`;
  }
  return `${price.CZK} Kč`;
}

type ProductsAdminListProps = {
  products: Product[];
  stock: Record<string, number>;
};

type Combination = {
  color?: string;
  size?: string;
};

function getProductCombinations(product: Product): Combination[] {
  const combos: Combination[] = [];

  if (product.models && product.models.length > 0) {
    product.models.forEach((model) => {
      if (model.colors && model.colors.length > 0) {
        model.colors.forEach((color) => {
          if (model.layered) {
            combos.push({ color: `${color.value}__body`, size: model.id });
            combos.push({ color: `${color.value}__cap`, size: model.id });
          } else {
            combos.push({ color: color.value, size: model.id });
          }
        });
      } else {
        combos.push({ size: model.id });
      }
    });
  } else {
    const hasColors = product.colors && product.colors.length > 0;
    const hasSizes = product.sizes && product.sizes.length > 0;

    if (hasColors && hasSizes) {
      product.colors!.forEach((color) => {
        product.sizes!.forEach((size) => {
          combos.push({ color: color.value, size: size.value });
        });
      });
    } else if (hasColors) {
      product.colors!.forEach((color) => {
        combos.push({ color: color.value });
      });
    } else if (hasSizes) {
      product.sizes!.forEach((size) => {
        combos.push({ size: size.value });
      });
    } else {
      combos.push({});
    }
  }

  return combos;
}

export default function ProductsAdminList({ products, stock }: ProductsAdminListProps) {
  const [currentStock, setCurrentStock] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      const combos = getProductCombinations(p);
      combos.forEach((c) => {
        const key = `${p.slug}|${c.color ?? "-"}|${c.size ?? "-"}`;
        initial[key] = stock[key] ?? 0;
      });
    });
    return initial;
  });

  const [expandedSlugs, setExpandedSlugs] = useState<Record<string, boolean>>({});
  const [expandedSubKeys, setExpandedSubKeys] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (slug: string) => {
    setExpandedSlugs((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const toggleSubExpand = (subKey: string) => {
    setExpandedSubKeys((prev) => ({ ...prev, [subKey]: !prev[subKey] }));
  };

  const handleStockChange = (key: string, value: number) => {
    setCurrentStock((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }));
  };

  const handleSaveVariant = async (key: string) => {
    setSavingKey(key);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log(`Ukládám variantu ${key} s novým stavem:`, currentStock[key]);
    } catch (error) {
      console.error("Chyba při ukládání skladu:", error);
    } finally {
      setSavingKey(null);
    }
  };

  const filteredProducts = products.filter((product) => {
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const renderVariantControls = (comboKey: string) => {
    const currentQty = currentStock[comboKey] ?? 0;
    const originalQty = stock[comboKey] ?? 0;
    const hasChanged = currentQty !== originalQty;

    return (
      <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center bg-[#f1f1f1] border border-[#e5e7eb] rounded-lg p-0.5 w-24 justify-between">
          <button
            type="button"
            onClick={() => handleStockChange(comboKey, currentQty - 1)}
            className="w-5 h-5 rounded bg-white flex items-center justify-center text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 shadow-sm active:scale-95 transition-all"
          >
            –
          </button>
          <input
            type="number"
            value={currentQty}
            onChange={(e) => handleStockChange(comboKey, parseInt(e.target.value) || 0)}
            className="w-8 bg-transparent text-center text-xs font-bold font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => handleStockChange(comboKey, currentQty + 1)}
            className="w-5 h-5 rounded bg-white flex items-center justify-center text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 shadow-sm active:scale-95 transition-all"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={!hasChanged || savingKey === comboKey}
          onClick={() => handleSaveVariant(comboKey)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
            hasChanged
              ? "bg-[#1c1c1c] text-white hover:bg-[#2e2e2e]"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
          }`}
        >
          {savingKey === comboKey ? (
            <span className="flex items-center space-x-1">
              <svg className="animate-spin h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </span>
          ) : hasChanged ? (
            "Uložit"
          ) : (
            "Uloženo"
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 justify-between items-center border-b border-[#e5e7eb] pb-5">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Hledat produkt podle názvu nebo slugu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f1f1f3] border border-[#e5e7eb] rounded-xl pl-9 pr-4 py-2 text-xs text-[#0f0f10] placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
          />
        </div>
        <div className="text-[11px] font-mono text-zinc-400 hidden sm:block">
          Nalezeno produktů: {filteredProducts.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e5e7eb] text-[10px] uppercase tracking-wider font-bold text-zinc-400 font-mono">
              <th className="pb-3 pl-2">Produkt</th>
              <th className="pb-3 hidden md:table-cell">Základní cena</th>
              <th className="pb-3 text-center w-36">Počet variant</th>
              <th className="pb-3 text-center w-36">Vyprodané var.</th>
              <th className="pb-3 text-right pr-2">Správa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]/60">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-zinc-400 font-mono">
                  Žádné produkty neodpovídají vyhledávání.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const combos = getProductCombinations(product);
                const isExpanded = !!expandedSlugs[product.slug];

                const emptyVariantsCount = combos.reduce((count, c) => {
                  const key = `${product.slug}|${c.color ?? "-"}|${c.size ?? "-"}`;
                  return (currentStock[key] ?? 0) === 0 ? count + 1 : count;
                }, 0);

                return (
                  <Fragment key={product.slug}>
                    <tr 
                      onClick={() => toggleExpand(product.slug)}
                      className={`group cursor-pointer transition-colors ${isExpanded ? "bg-[#fcfbf9]" : "hover:bg-[#fcfbf9]/60"}`}
                    >
                      <td className="py-4 pl-2 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-[#f1f1f3] border border-[#e5e7eb] overflow-hidden flex-shrink-0 relative">
                          <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0f0f10] leading-tight group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">{product.slug}</span>
                        </div>
                      </td>

                      <td className="py-4 text-xs font-semibold text-[#0f0f10] hidden md:table-cell">
                        {formatPrice(product.price)}
                      </td>

                      <td className="py-4 text-center text-xs font-mono font-medium text-zinc-600">
                        {combos.length}x
                      </td>

                      <td className="py-4 text-center">
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          emptyVariantsCount === combos.length
                            ? "bg-rose-50 text-rose-700" 
                            : emptyVariantsCount > 0
                            ? "bg-amber-50 text-amber-700" 
                            : "bg-zinc-100 text-zinc-400 font-normal" 
                        }`}>
                          {emptyVariantsCount} {emptyVariantsCount === 1 ? "varianta" : emptyVariantsCount >= 2 && emptyVariantsCount <= 4 ? "varianty" : "variant"}
                        </span>
                      </td>

                      <td className="py-4 text-right pr-2">
                        <button
                          type="button"
                          className="px-2.5 py-1.5 rounded-lg border border-[#e5e7eb] bg-white text-[11px] font-semibold text-zinc-600 hover:bg-[#f1f1f3] hover:text-[#0f0f10] transition-all flex items-center space-x-1 ml-auto"
                        >
                          <span>{isExpanded ? "Zavřít" : "Upravit sklad"}</span>
                          <svg 
                            className={`w-3 h-3 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-[#fdfdfd] border-l-2 border-[#1c1c1c] p-0">
                          <div className="px-4 py-4 bg-[#fcfbf9]/40 border-b border-[#e5e7eb]/60 space-y-4">
                            
                            {product.models && product.models.length > 0 ? (
                              product.models.map((model) => (
                                <div key={model.id} className="border border-[#e5e7eb] rounded-xl bg-white overflow-hidden shadow-sm">
                                  <div className="bg-[#f1f1f3]/50 px-3 py-2 border-b border-[#e5e7eb] text-[10px] font-bold text-[#0f0f10] font-mono uppercase tracking-wider">
                                    {model.label}
                                  </div>
                                  
                                  <div className="divide-y divide-[#e5e7eb]/50">
                                    {model.colors?.map((color) => {
                                      if (model.layered) {
                                        const subKey = `${product.slug}|${model.id}|${color.value}`;
                                        const isSubExpanded = !!expandedSubKeys[subKey];
                                        const bodyKey = `${product.slug}|${color.value}__body|${model.id}`;
                                        const capKey = `${product.slug}|${color.value}__cap|${model.id}`;
                                        
                                        // Využití Math.min pro reálnou sestavitelnost kompletního produktu
                                        const colorAvailable = Math.min(
                                          currentStock[bodyKey] ?? 0,
                                          currentStock[capKey] ?? 0
                                        );

                                        return (
                                          <div key={color.value} className="flex flex-col">
                                            <div 
                                              onClick={() => toggleSubExpand(subKey)}
                                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#faf9f6]/40 transition-colors"
                                            >
                                              <div className="flex items-center space-x-2.5">
                                                {color.hex && <span className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: color.hex }} />}
                                                <span className="text-xs font-bold text-[#0f0f10]">{color.label}</span>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                                  colorAvailable === 0 ? "bg-rose-50 text-rose-600" : "bg-zinc-100 text-zinc-600"
                                                }`}>
                                                  {colorAvailable} ks
                                                </span>
                                                <svg 
                                                  className={`w-3 h-3 text-zinc-400 transform transition-transform duration-150 ${isSubExpanded ? "rotate-180" : ""}`} 
                                                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                                                >
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                              </div>
                                            </div>

                                            {isSubExpanded && (
                                              <div className="bg-[#fcfbf9]/60 border-t border-[#e5e7eb]/40 divide-y divide-[#e5e7eb]/40 pl-8 pr-3 py-0.5">
                                                <div className="flex items-center justify-between py-2.5">
                                                  <div className="space-y-0.5">
                                                    <div className="text-xs font-semibold text-zinc-700">{color.label} — Tělo</div>
                                                    <div className="text-[9px] font-mono text-zinc-400">{bodyKey}</div>
                                                  </div>
                                                  {renderVariantControls(bodyKey)}
                                                </div>
                                                <div className="flex items-center justify-between py-2.5">
                                                  <div className="space-y-0.5">
                                                    <div className="text-xs font-semibold text-zinc-700">{color.label} — Hlava</div>
                                                    <div className="text-[9px] font-mono text-zinc-400">{capKey}</div>
                                                  </div>
                                                  {renderVariantControls(capKey)}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      } else {
                                        const comboKey = `${product.slug}|${color.value}|${model.id}`;
                                        return (
                                          <div key={color.value} className="flex items-center justify-between p-3 hover:bg-[#faf9f6]/30 transition-colors">
                                            <div className="flex items-center space-x-2.5">
                                              {color.hex && <span className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: color.hex }} />}
                                              <div>
                                                <span className="text-xs font-bold text-[#0f0f10]">{color.label}</span>
                                                <span className="text-[9px] font-mono text-zinc-400 block">{comboKey}</span>
                                              </div>
                                            </div>
                                            {renderVariantControls(comboKey)}
                                          </div>
                                        );
                                      }
                                    })}
                                  </div>
                                </div>
                              ))
                            ) : (
                              (() => {
                                const hasColors = product.colors && product.colors.length > 0;
                                const hasSizes = product.sizes && product.sizes.length > 0;

                                if (hasColors && hasSizes) {
                                  return product.sizes!.map((size) => (
                                    <div key={size.value} className="border border-[#e5e7eb] rounded-xl bg-white overflow-hidden shadow-sm">
                                      <div className="bg-[#f1f1f3]/50 px-3 py-2 border-b border-[#e5e7eb] text-[10px] font-bold text-[#0f0f10] font-mono uppercase tracking-wider">
                                        {size.label}
                                      </div>
                                      <div className="divide-y divide-[#e5e7eb]/50">
                                        {product.colors!.map((color) => {
                                          const comboKey = `${product.slug}|${color.value}|${size.value}`;
                                          return (
                                            <div key={color.value} className="flex items-center justify-between p-3 hover:bg-[#faf9f6]/30 transition-colors">
                                              <div className="flex items-center space-x-2.5">
                                                {color.hex && <span className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: color.hex }} />}
                                                <div>
                                                  <span className="text-xs font-bold text-[#0f0f10]">{color.label}</span>
                                                  <span className="text-[9px] font-mono text-zinc-400 block">{comboKey}</span>
                                                </div>
                                              </div>
                                              {renderVariantControls(comboKey)}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ));
                                } else if (hasColors) {
                                  return (
                                    <div className="border border-[#e5e7eb] rounded-xl bg-white overflow-hidden shadow-sm divide-y divide-[#e5e7eb]/50">
                                      {product.colors!.map((color) => {
                                        const comboKey = `${product.slug}|${color.value}|-`;
                                        return (
                                          <div key={color.value} className="flex items-center justify-between p-3 hover:bg-[#faf9f6]/30 transition-colors">
                                            <div className="flex items-center space-x-2.5">
                                              {color.hex && <span className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: color.hex }} />}
                                              <div>
                                                <span className="text-xs font-bold text-[#0f0f10]">{color.label}</span>
                                                <span className="text-[9px] font-mono text-zinc-400 block">{comboKey}</span>
                                              </div>
                                            </div>
                                            {renderVariantControls(comboKey)}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                } else if (hasSizes) {
                                  return (
                                    <div className="border border-[#e5e7eb] rounded-xl bg-white overflow-hidden shadow-sm divide-y divide-[#e5e7eb]/50">
                                      {product.sizes!.map((size) => {
                                        const comboKey = `${product.slug}|-|${size.value}`;
                                        return (
                                          <div key={size.value} className="flex items-center justify-between p-3 hover:bg-[#faf9f6]/30 transition-colors">
                                            <div>
                                              <span className="text-xs font-bold text-[#0f0f10]">{size.label}</span>
                                              <span className="text-[9px] font-mono text-zinc-400 block">{comboKey}</span>
                                            </div>
                                            {renderVariantControls(comboKey)}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                } else {
                                  const comboKey = `${product.slug}|-|-`;
                                  return (
                                    <div className="border border-[#e5e7eb] rounded-xl bg-white overflow-hidden shadow-sm p-3 flex items-center justify-between">
                                      <div>
                                        <span className="text-xs font-bold text-[#0f0f10]">Základní varianta</span>
                                        <span className="text-[9px] font-mono text-zinc-400 block">{comboKey}</span>
                                      </div>
                                      {renderVariantControls(comboKey)}
                                    </div>
                                  );
                                }
                              })()
                            )}

                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}