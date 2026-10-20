import { useRef } from "react";
import { Alert } from "react-native";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";

type Copy = { title?: string; message?: string; onDiscard?: () => void };

/**
 * Zaštita od slučajnog izlaska (swipe dolje, „natrag“, X) dok forma ima nespremljene promjene: pita „Odbaciti promjene?“.
 * Vraća `allowLeave()`: pozovi je neposredno prije namjernog izlaska (npr. nakon spremanja), da se ne pita.
 */
export function useConfirmDiscard(dirty: boolean, copy: Copy = {}): () => void {
  const navigation = useNavigation();
  const allowed = useRef(false);
  usePreventRemove(dirty, ({ data }) => {
    if (allowed.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert(copy.title ?? "Odbaciti promjene?", copy.message ?? "Ono što si upisao neće se spremiti.", [
      { text: "Nastavi uređivati", style: "cancel" },
      {
        text: "Odbaci",
        style: "destructive",
        onPress: () => {
          allowed.current = true;
          copy.onDiscard?.();
          navigation.dispatch(data.action);
        },
      },
    ]);
  });
  return () => {
    allowed.current = true;
  };
}
