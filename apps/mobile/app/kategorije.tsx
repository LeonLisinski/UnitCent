import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { CatIcon } from "../src/components";
import { useDb } from "../src/data";
import { Glow, RoundButton, SwipeRow } from "../src/fx";
import { Icon } from "../src/icons";
import { Safe } from "../src/safe";
import { useTheme } from "../src/theme";
import { useToast } from "../src/toast";
import { T } from "../src/ui";
import { deleteCategory, listCategories, restoreCategory } from "../src/db/repo";

/** Popis kategorija: dodir uređuje, povlačenje ulijevo briše (uz „Poništi“). */
export default function Kategorije() {
  const { colors, fx, space } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const cats = useDb(() => listCategories());

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Glow />
      <Safe>
        <View style={{ flex: 1, paddingHorizontal: space["4"] + 4, paddingTop: space["3"], gap: space["3"] }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <T v="title-1" style={{ fontSize: 28, lineHeight: 34 }}>Kategorije</T>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <RoundButton icon="plus" label="Nova kategorija" onPress={() => router.push("/kategorija")} />
              <RoundButton icon="x" label="Zatvori" onPress={() => router.back()} />
            </View>
          </View>
          <T v="caption" muted>Dodirni za uređivanje, povuci ulijevo za brisanje.</T>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space["5"] }}>
            {cats.map((c, i) => (
              <SwipeRow
                key={c.id}
                onDelete={() => {
                  deleteCategory(c.id);
                  toast.show(`Obrisano: ${c.name}`, { label: "Poništi", run: () => restoreCategory(c.id) });
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Uredi kategoriju ${c.name}`}
                  onPress={() => router.push({ pathname: "/kategorija", params: { id: c.id } })}
                  style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.bg, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: fx.line }}
                >
                  <CatIcon colorToken={c.colorToken} icon={c.icon} size={40} />
                  <T v="headline" style={{ flex: 1, fontWeight: "700" }} numberOfLines={1}>{c.name}</T>
                  <Icon name="chev" size={18} color={colors["ink-muted"]} />
                </Pressable>
              </SwipeRow>
            ))}
          </ScrollView>
        </View>
      </Safe>
    </View>
  );
}
