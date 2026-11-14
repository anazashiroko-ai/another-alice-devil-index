# 四月島・検証マップ：共通能力処理 × 原作の実戦観測

**2026-11-14／ケイ作成。** 実装現行版004.8のソース349件の規則、旧・専用実装43体、原作の観測を対応付ける**全392体の検証索引**。

> **先に重要な区別：** 「内部自動テスト合格」「説明文の式との一致」「原作バトルログの観測」「すべての条件で原作を再現」はそれぞれ別。ここに「原作完全一致392体」と書くことはない。

## 1. 全体像

| 検証対象 | 数 | 意味 |
|---|---:|---|
| 図鑑 | 396体 | うちヨハン系2体は意図的に能力未実装、2体は戦闘計算対象外 |
| 実装モデル | **392体** | 原作照合を全件完了した意味ではない |
| 宣言的ルール | **349体** | 共通演算の種類とパラメータを自動で抽出可能 |
| 手書きロジック | **43体** | 自動演算分析には含まれず別管理 |
| 共通ルール上位演算名 | **167種類** | さらに入れ子だけに出現する1種を含めると**168種類** |
| 2体以上で共有する演算名 | **49種類** | 共通単体テストの再利用が期待できる |
| 1体限定の演算名 | **119種類** | 固有テストを中心に検討 |
| 既存台帳の実戦規則反映 | **8体** | 主な実戦ルール反映。全例外の保証ではない |
| 主経路の観測が紐づいたもの | **27体** | 基本動作を一から確認する重複実験は抑えられる |
| 一部の観測が紐づいたもの | **17体** | 観測された部分だけ再利用 |
| 既存観測の紐づけがまだないもの | **340体** | 「未観測」ではない。参照資料の再検索候補 |

※演算名168種のうち、**入れ子専用の `blockDevilFuture`** が上位167種に含まれない。入れ子を辿って演算名を集計しているため、合計が1だけ増える。

## 2. 「ズル」が成立する条件

- **I（内部処理）**：共通演算 `multiply` などの端数・符号・状態更新は、共通の自動テストでまとめて確認できる。
- **S（個別能力の指定）**：同じ演算を使っていても、倍率・参照先・効果の対象・発動フェーズ・ターン制限・持続の指定は、各デビルで図鑑原文と照合する。
- **L（原作観測）**：バトルログと数値が照合できた主経路は、同じ試験を繰り返さない。相手側の脇役として発動した能力も原作証拠として使う。
- **X（未解決の例外・競合）**：時間操作、デビル消滅、先攻差、負値、乱数等。重要な状況でだけゲーム本体を使って追加実験する。

**注意**：Iの試験合格はSやLの合格へ自動伝播しない。トップレベルの演算が同じでも、引数・入れ子条件や呼出しタイミングが異なり得る。このマップのA/Bは旧研究ノートに由来する**観測の索引**であり、新規に原作ログ全量の再照合を完了したという主張ではない。

## 3. 共通演算別マップ（入れ子含む168種類）

「関係デビル」は同じ演算を1回以上呼び出す体数。1体が複数行に現れる。表の「観測A／B／verified」は**その演算を含むデビルに証拠リンクがある数**であり、演算自体が全条件で検証済みという意味ではない。

| 共通演算名 | 機構（暫定自動分類） | 関係デビル数 | 主経路A | 部分B | verified | 既存証拠に紐づく図鑑ID（例） |
|---|---|---:|---:|---:|---:|---|

| `multiply` | ステータス数値 | 67 | 2 | 2 | 0 | #1、#3、#14、#242 |
| `noAttack` | 攻撃・防御・状態 | 51 | 0 | 0 | 0 | — |
| `set` | ステータス数値 | 31 | 0 | 0 | 0 | — |
| `add` | ステータス数値 | 25 | 0 | 1 | 0 | #185 |
| `damage` | 攻撃・防御・状態 | 24 | 0 | 2 | 0 | #21、#26 |
| `swap` | ステータス数値 | 16 | 1 | 0 | 0 | #40 |
| `transfer` | ステータス数値 | 14 | 0 | 0 | 0 | — |
| `destroyEnemy` | デビル枠・再発動 | 11 | 0 | 0 | 0 | — |
| `subtract` | ステータス数値 | 9 | 0 | 1 | 0 | #60 |
| `suppressEnemy` | 攻撃・防御・状態 | 9 | 0 | 0 | 0 | — |
| `tempMultiply` | ステータス数値 | 8 | 0 | 1 | 0 | #14 |
| `destroyAllEnemyAttr` | デビル枠・再発動 | 6 | 0 | 0 | 0 | — |
| `ifPreviousDevil` | デビル枠・再発動 | 5 | 0 | 0 | 0 | — |
| `registerEndOfTurnStatGrowth` | ステータス数値 | 5 | 0 | 0 | 0 | — |
| `reset` | ステータス数値 | 5 | 0 | 0 | 0 | — |
| `whenEnemyAttr` | 条件・分岐 | 5 | 0 | 0 | 0 | — |
| `blockEnemyAttackFuture` | 攻撃・防御・状態 | 4 | 0 | 0 | 0 | — |
| `confuse` | 攻撃・防御・状態 | 4 | 0 | 0 | 0 | — |
| `forceFirst` | 固有・その他 | 4 | 0 | 0 | 0 | — |
| `multiplyEquipmentBonus` | 装備・外部情報 | 4 | 0 | 1 | 0 | #264 |
| `reduceDamage` | 攻撃・防御・状態 | 4 | 0 | 0 | 0 | — |
| `setEnemyHighest` | ステータス数値 | 4 | 0 | 0 | 0 | — |
| `evade` | 攻撃・防御・状態 | 3 | 0 | 0 | 0 | — |
| `instantKillChance` | 攻撃・防御・状態 | 3 | 0 | 0 | 0 | — |
| `magicHit` | 攻撃・防御・状態 | 3 | 0 | 0 | 0 | — |
| `reviveOnce` | 攻撃・防御・状態 | 3 | 0 | 0 | 0 | — |
| `stopTurn` | 固有・その他 | 3 | 0 | 0 | 0 | — |
| `tempSet` | ステータス数値 | 3 | 0 | 0 | 0 | — |
| `attackAgain` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `attributeKindsBoost` | ステータス数値 | 2 | 0 | 0 | 0 | — |
| `cancelMagic` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `chanceBlockEnemyAttack` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `chanceMagic` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `coppeliaDoll` | 装備・外部情報 | 2 | 0 | 0 | 0 | — |
| `damageLastHit` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `destroyBothDevilsForTurns` | デビル枠・再発動 | 2 | 0 | 0 | 0 | — |
| `externalScaledAdd` | ステータス数値 | 2 | 0 | 0 | 0 | — |
| `gentlemanRotate` | 固有・その他 | 2 | 0 | 0 | 0 | — |
| `ifEnemyAttrSteal` | 条件・分岐 | 2 | 0 | 0 | 0 | — |
| `randomChoice` | 固有・その他 | 2 | 0 | 0 | 0 | — |
| `reduceEnemyDefenseLastHit` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `restoreIfBelow` | 条件・分岐 | 2 | 0 | 0 | 0 | — |
| `sacrificeHp` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `startMagic` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `stealEnemyMagicToHp` | 攻撃・防御・状態 | 2 | 0 | 0 | 0 | — |
| `swapHighestLowest` | ステータス数値 | 2 | 0 | 0 | 0 | — |
| `swapOtherSlots` | デビル枠・再発動 | 2 | 0 | 0 | 0 | — |
| `whenAllDeckAttr` | デビル枠・再発動 | 2 | 0 | 1 | 0 | #242 |
| `whenHour` | 時間・ターン | 2 | 0 | 0 | 0 | — |
| `absorbNormalAttack` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `addOwnTotalDpToStat` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `alastorReactive` | 固有・その他 | 1 | 1 | 0 | 0 | #94 |
| `allocesAfter` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `assistCompareDestroyNext` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `assistCompareEvade` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `assistCountBoost` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `assistMultiplier` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `assistThreshold` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `attackHalfToEnemyAndConfuse` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `attackTurnBoost` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `baseDefenseCompareAbsorb` | 条件・分岐 | 1 | 0 | 0 | 0 | — |
| `blockDevil` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `blockDevilFuture` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `boostDefenseLastHit` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `catSidhe` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `chanceEvade` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `chanceMagicConfuse` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `chanceSwap` | 条件・分岐 | 1 | 0 | 0 | 0 | — |
| `cheshireCat` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `clearEnemyForcedFirst` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `copyEnemyPositiveBoosts` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `cureReflectConfuse` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `cureStatuses` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `damageTakenBoost` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `damageThisTurnDouble` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `darkDeckDestroyCount` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `deckCountAttackBoost` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `deckCountBoost` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `deckCountDamage` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `deletedDevilCountBoost` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `destroyByAttrAndBoost` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `dpBasedHpBoost` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `dpCompareBoost` | 条件・分岐 | 1 | 0 | 0 | 0 | — |
| `enemyAttackToHp` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `enemyTotalDpDamage` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `equipmentSubtractScaled` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `externalLvDpDamage` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `externalRankBoost` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `extraAttackAtEnd` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `farinishMagicBoost` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `fenrirRandomAttack` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `firstOrSecondBuff` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `genderConditional` | 条件・分岐 | 1 | 0 | 0 | 0 | — |
| `goldCompareBuff` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `harmonicsComparison` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `hellTurnRewind` | 時間・ターン | 1 | 1 | 0 | 0 | #285 |
| `higherLowerHeal` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `highestStealToHp` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `icarusExternal` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `ifMagicActiveThen` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `ifSelfMagicBelow` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `incubusStatChange` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `instantKillChanceFromDP` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `johnGoalSpecial` | 固有・その他 | 1 | 1 | 0 | 0 | #318 |
| `kikimora` | 時間・ターン | 1 | 0 | 0 | 0 | — |
| `libraLevel` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `magicCompareSwapHp` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `magicHalfAllStats` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `magicOrDestroy` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `magicRatioForceFirst` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `magicToAttack` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `mandragoraEarth` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `mandragoraFirstSecond` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `mastimaBeelzebub` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `moiraConditional` | 条件・分岐 | 1 | 0 | 0 | 0 | — |
| `moraTurnAdvance` | 時間・ターン | 1 | 1 | 0 | 0 | #295 |
| `nameLengthCompare` | 条件・分岐 | 1 | 0 | 0 | 0 | — |
| `nanaAttrDestroyDamage` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `nemissaHarmonics` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `nemophilaSwapNext` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `nightmareOwnRemoveDp` | 固有・その他 | 1 | 0 | 1 | 0 | #307 |
| `nightstalkDeck` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `oberonTime` | 時間・ターン | 1 | 0 | 0 | 0 | — |
| `ojiNaberius` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `orderHighestBuff` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `randomEnemyBaseToHp` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `randomStatAdd` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `randomStatTriple` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `rankDamage` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `reflect` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `registerEnemyAllStatDrain` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `repeatPrevious` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `resetAllEnemyStats` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `resetEnemyAttack` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `restoreRemovedDevils` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `rotateEnemy` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `sacrificeStatToHp` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `scheduleDeathCurse` | デビル枠・再発動 | 1 | 0 | 0 | 0 | — |
| `scheduleStealNextEnemy` | デビル枠・再発動 | 1 | 0 | 1 | 0 | #215 |
| `schrodingerCatBranches` | 固有・その他 | 1 | 1 | 0 | 0 | #131 |
| `secondHighestDebuff` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `secondLowestDebuff` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `selfMinToEnemyMax` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `setEnemyInitialMagic` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `setTwoLowestSelf` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `shamshelDp` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `shamshelVariantDp` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `sharedMagicHit` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `shuffleEnemyStats` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `sprigganGuard` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `stealAssistStats` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `stealAttackLeaveOne` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `stealEnemyAllToAttack` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `stealEnemyAllToHp` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `stealEnemyDevilNow` | デビル枠・再発動 | 1 | 0 | 1 | 0 | #83 |
| `stealEquipmentHalf` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `stealExcessInitial` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `stealHighestToDefense` | 固有・その他 | 1 | 0 | 1 | 0 | #284 |
| `stealHpToAttack` | 攻撃・防御・状態 | 1 | 0 | 0 | 0 | — |
| `swapEquipmentStats` | 装備・外部情報 | 1 | 0 | 0 | 0 | — |
| `swapSelfMinEnemyMax` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `swapSelfMinEnemyStat` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `thresholdSet` | 条件・分岐 | 1 | 0 | 0 | 0 | — |
| `titaniaWaterFire` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `transferExcess` | ステータス数値 | 1 | 0 | 0 | 0 | — |
| `tsumaNaberius` | 固有・その他 | 1 | 0 | 0 | 0 | — |
| `vidofnirEquipmentAssist` | 装備・外部情報 | 1 | 1 | 0 | 0 | #319 |
| `whenSelfGreater` | 条件・分岐 | 1 | 0 | 0 | 0 | — |


## 4. 個別の手書きロジック（43体）

コードは存在するが「宣言的な共通演算」に自動分類できない部分。**手書き＝実戦未観測ではない**。既に観測があるデビルも多い。

| 図鑑ID・名称 | モデル分類 | 実戦観測の状況 | 次の検証で絞る点 |
|---|---|---|---|

| #41 エリゴス | legacy | 攻撃3652に+5478（1.5倍を加算） | 複合補正後の端数 |
| #46 ウヴァル | verified | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #47 バラム | legacy | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #56 ハーゲンティ | legacy | 装備補正参照・ウヴァルとの扱いが報告されるが単独数値照合不足 | 固有能力の参照値・発動条件・競合 |
| #59 バアル | legacy | 攻撃前発動と攻撃禁止で発動しない例を観測。全能力未照合 | 固有能力の参照値・発動条件・競合 |
| #64 ヴィネ | legacy | 前ターン札カマエル・ヘクセンを再発動し数値効果が再実行 | 予約された攻撃後能力が阻止された場合 |
| #90 オンディーナ | provisional | 同条件の反射ダメージ516と通常ダメージ516が一致 | 反射と回避・混乱・守備閾値の競合 |
| #97 バフォメット | legacy | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #100 ブラウナ | provisional | ブラウナによるジャック・ロレ再呼出しを観測。内部経路・例外不明 | 固有能力の参照値・発動条件・競合 |
| #104 サルガタナス | legacy | 相手の装備3150/2000/8417/18100をそのまま模倣 | 装備消去後の参照 |
| #107 ◎ヘクセンナハト | legacy | 初期HP25436×30%→7630持続、ヴィネ再発動で二重計上せず | 継続効果の上書き・消滅 |
| #115 クロリッサ | legacy | 攻撃・守備・魔力の初期値復元、後続処理の強制終了 | 特殊予約と同時発動 |
| #119 ベルゼブブ | legacy | 既知の敵3構成・計18枠が反転後の発動順と一致 | 既発動札を逆順で再登場させる場合 |
| #125 ジャック・ロレ | verified | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #137 アガリアレプト | verified | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #141 ◎ディアーナ | description | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #142 フルーレティ | verified | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #143 カマエル | legacy | 魔力11634÷2→攻撃+5817、ヴィネ再発動でも+5817、次T阻止も観測 | 他の次ターン予約との競合 |
| #148 マシュー・ホプキンス | description | 相手魔力を1へ、先発動デビルの効果を遡及取消しない | ジョン・ゴール等の例外条件 |
| #162 ナルキッソス | legacy | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #167 アバドン | description | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #179 トロール | legacy | 1枠遅延、既発動札の再出現、6T押出しの実戦を照合 | 6T枠の内部消滅扱い |
| #192 プロセルピナ | verified | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #193 ◎ナパイア | verified | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #198 ブランド・フォルター | verified | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #213 ラプラス | legacy | 過去／現行札の再実体化と発動タイミングを複数戦で照合 | 複数段能力と同T二度目の指定 |
| #240 スクルド | legacy | 再発動で現体力を再判定、36701→18351、ネモフィラ阻止 | 同値・回復側の特殊分岐 |
| #255 枷から解き放たれたマゴト | verified | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #260 党首の威光を放つベレト | description | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #265 ◎鮮血を浴びたクランプス | legacy | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #271 ◎春を喜ぶブリギット | description | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #287 フレイヤ | legacy | 相手攻撃力2570／5610と同額の直接ダメージを観測 | 相手魔力の方が高い場合 |
| #291 賢者の火・フルカス | legacy | 守備6133→−1839・体力17806→−5341、未来枠阻止 | 取消後の枠再登場 |
| #292 未来を視通すプルソン | legacy | 当ターン回避と翌ターン敵攻撃不能を実戦で観測 | 攻撃禁止・混乱との競合 |
| #311 ウヴァル＆ファタ・モルガナ | provisional | 元装備補正の繰り返し減算を報告・照合。自己攻撃増加等の全挙動未照合 | 固有能力の参照値・発動条件・競合 |
| #336 アブンディア | description | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #358 密かに微笑むブランド・フォルター | provisional | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #366 赤い秘密を交わすフォルター夫妻 | legacy | 装備補正の4能力無効化と、HP1483から5295を引き即時敗北 | 装備補正の再付与・複数無効化 |
| #368 オドラデク | legacy | 装備無効化後の能力発動を観測。閾値の参照先は未確定 | 固有能力の参照値・発動条件・競合 |
| #378 雪崩を切り裂くルシファー | provisional | ルシファーの発動と召喚予約取消らしい分岐を観測。3倍減算の基準不明 | 固有能力の参照値・発動条件・競合 |
| #381 謹賀新年・アリエル | description | 今回の資料では対応未登録 | 固有能力の参照値・発動条件・競合 |
| #386 王の風・グレモリー | legacy | 魔力3354×2.5→攻撃8385が後続ターン持続 | 妨害同時処理・魔力変動 |
| #389 うさぎと戯れるナルキッソス | legacy | 素値×2.5の加算、現在HP93036.5を保持（小数あり） | 敵デビル消去の境界 |


## 5. デビル392体 × 共有演算 × 原作観測

**原作の実戦ログ・研究記録が紐づくことと、全能力検証済みは別。** さらに詳細な実装パラメータ、入れ子演算、証拠出典は[機械可読JSON](2026-11-14-verification-map.json)にある。


### 既存実戦規則反映8体

現行台帳で実戦の主規則を反映したデビル。原作の全条件一致は未確認。

| ID・デビル | モデル | 共通演算（上位） | 原作観測と未確定条件 |
|---|---|---|---|

| #46 ウヴァル | verified | **手書き個別処理** | 実戦反映は現行台帳の分類（完全保証ではない） |
| #125 ジャック・ロレ | verified | **手書き個別処理** | 実戦反映は現行台帳の分類（完全保証ではない） |
| #137 アガリアレプト | verified | **手書き個別処理** | 実戦反映は現行台帳の分類（完全保証ではない） |
| #142 フルーレティ | verified | **手書き個別処理** | 実戦反映は現行台帳の分類（完全保証ではない） |
| #192 プロセルピナ | verified | **手書き個別処理** | 実戦反映は現行台帳の分類（完全保証ではない） |
| #193 ◎ナパイア | verified | **手書き個別処理** | 実戦反映は現行台帳の分類（完全保証ではない） |
| #198 ブランド・フォルター | verified | **手書き個別処理** | 実戦反映は現行台帳の分類（完全保証ではない） |
| #255 枷から解き放たれたマゴト | verified | **手書き個別処理** | 実戦反映は現行台帳の分類（完全保証ではない） |


### 主経路に実戦観測を紐づけた27体

基本ルートの確認を重複してやり直さず、既存研究で未確定とした条件のみを追う。

| ID・デビル | モデル | 共通演算（上位） | 原作観測と未確定条件 |
|---|---|---|---|

| #1 ウァサゴ | description | `multiply` | ヴィドフニル戦：攻撃9130→+1826（20%） ／ 残る条件：魔力戦や負値の影響 |
| #3 マルバス | description | `multiply` | 攻撃6181に対して+3090（50%、端数切捨て） ／ 残る条件：端数が負値のとき |
| #40 パイモン | description | `swap` | 魔力12463／HP1の入替が実戦で成立 ／ 残る条件：死亡との競合 |
| #41 エリゴス | legacy | **手書き個別処理** | 攻撃3652に+5478（1.5倍を加算） ／ 残る条件：複合補正後の端数 |
| #64 ヴィネ | legacy | **手書き個別処理** | 前ターン札カマエル・ヘクセンを再発動し数値効果が再実行 ／ 残る条件：予約された攻撃後能力が阻止された場合 |
| #90 オンディーナ | provisional | **手書き個別処理** | 同条件の反射ダメージ516と通常ダメージ516が一致 ／ 残る条件：反射と回避・混乱・守備閾値の競合 |
| #94 アラストル | partial | `alastorReactive` | 被ダメージ1920×5＝攻撃+9600、後続ターン持続 ／ 残る条件：特殊ダメージ、複数被弾 |
| #104 サルガタナス | legacy | **手書き個別処理** | 相手の装備3150/2000/8417/18100をそのまま模倣 ／ 残る条件：装備消去後の参照 |
| #107 ◎ヘクセンナハト | legacy | **手書き個別処理** | 初期HP25436×30%→7630持続、ヴィネ再発動で二重計上せず ／ 残る条件：継続効果の上書き・消滅 |
| #115 クロリッサ | legacy | **手書き個別処理** | 攻撃・守備・魔力の初期値復元、後続処理の強制終了 ／ 残る条件：特殊予約と同時発動 |
| #119 ベルゼブブ | legacy | **手書き個別処理** | 既知の敵3構成・計18枠が反転後の発動順と一致 ／ 残る条件：既発動札を逆順で再登場させる場合 |
| #131 シュレディンガー | partial | `schrodingerCatBranches` | 猫あり相手・自猫あり・猫なしの実戦3分岐と現在テーブル参照 ／ 残る条件：双方猫・未分類猫・同値ステータス |
| #143 カマエル | legacy | **手書き個別処理** | 魔力11634÷2→攻撃+5817、ヴィネ再発動でも+5817、次T阻止も観測 ／ 残る条件：他の次ターン予約との競合 |
| #148 マシュー・ホプキンス | description | **手書き個別処理** | 相手魔力を1へ、先発動デビルの効果を遡及取消しない ／ 残る条件：ジョン・ゴール等の例外条件 |
| #179 トロール | legacy | **手書き個別処理** | 1枠遅延、既発動札の再出現、6T押出しの実戦を照合 ／ 残る条件：6T枠の内部消滅扱い |
| #213 ラプラス | legacy | **手書き個別処理** | 過去／現行札の再実体化と発動タイミングを複数戦で照合 ／ 残る条件：複数段能力と同T二度目の指定 |
| #240 スクルド | legacy | **手書き個別処理** | 再発動で現体力を再判定、36701→18351、ネモフィラ阻止 ／ 残る条件：同値・回復側の特殊分岐 |
| #285 ヘル | partial | `hellTurnRewind` | 4T→1Tへ巻戻し、現在値を保持、2・3T能力が再発動 ／ 残る条件：予約効果・時間操作競合 |
| #287 フレイヤ | legacy | **手書き個別処理** | 相手攻撃力2570／5610と同額の直接ダメージを観測 ／ 残る条件：相手魔力の方が高い場合 |
| #291 賢者の火・フルカス | legacy | **手書き個別処理** | 守備6133→−1839・体力17806→−5341、未来枠阻止 ／ 残る条件：取消後の枠再登場 |
| #292 未来を視通すプルソン | legacy | **手書き個別処理** | 当ターン回避と翌ターン敵攻撃不能を実戦で観測 ／ 残る条件：攻撃禁止・混乱との競合 |
| #295 モーラ | partial | `moraTurnAdvance` | 2T終了時の表示『3ターンになった』と、次の4T相当進行 ／ 残る条件：3T飛越しは配置情報未提示の推論、6T境界 |
| #318 ジョン・ゴール | partial | `johnGoalSpecial` | 元魔力11743の2倍23486／対マシュー3倍35229の数値一致 ／ 残る条件：対マシュー追加効果の発動優先順位 |
| #319 ヴィドフニル | partial | `vidofnirEquipmentAssist` | 自己17%、相手1人で99%減・6人で94%減を4能力ずつ2戦照合 ／ 残る条件：装備無効化・アシスト上限 |
| #366 赤い秘密を交わすフォルター夫妻 | legacy | **手書き個別処理** | 装備補正の4能力無効化と、HP1483から5295を引き即時敗北 ／ 残る条件：装備補正の再付与・複数無効化 |
| #386 王の風・グレモリー | legacy | **手書き個別処理** | 魔力3354×2.5→攻撃8385が後続ターン持続 ／ 残る条件：妨害同時処理・魔力変動 |
| #389 うさぎと戯れるナルキッソス | legacy | **手書き個別処理** | 素値×2.5の加算、現在HP93036.5を保持（小数あり） ／ 残る条件：敵デビル消去の境界 |


### 部分観測を紐づけた17体

一部の発動や数値が観測されている。全能力の動作保証と混同しない。

| ID・デビル | モデル | 共通演算（上位） | 原作観測と未確定条件 |
|---|---|---|---|

| #14 モラクス | partial | `tempMultiply`＋`multiply` | きゃりこ戦で攻撃前の実体化を確認。数値・条件までは未照合 |
| #21 ストラス | partial | `damage` | ラプラス経由の攻撃後直接ダメージ7326を表示。計算基準未照合 |
| #26 フォカロル | partial | `damage` | 攻撃後効果の有無とヴィネ経由取消を観測。基礎数値式は未照合 |
| #56 ハーゲンティ | legacy | **手書き個別処理** | 装備補正参照・ウヴァルとの扱いが報告されるが単独数値照合不足 |
| #59 バアル | legacy | **手書き個別処理** | 攻撃前発動と攻撃禁止で発動しない例を観測。全能力未照合 |
| #60 アモン | description | `subtract` | 負魔力時にデバフが加算へ反転するとのマリコ実戦報告。原ログによる独立照合は別 |
| #83 ◎死と再生 | partial | `stealEnemyDevilNow` | 奪取後シュレディンガーが現在側の猫を参照する例。死と再生全能力未照合 |
| #100 ブラウナ | provisional | **手書き個別処理** | ブラウナによるジャック・ロレ再呼出しを観測。内部経路・例外不明 |
| #185 ◎ママ・ナベリウス | partial | `add` | 魔力1の状態でHP+1を観測。次ターン先攻保証・競合不明 |
| #215 ◎誕生と消滅 | partial | `scheduleStealNextEnemy` | 誕生と消滅→ヴィネ再発動→ブラウナ停止の表示。奪取全分岐不明 |
| #242 ロキ | partial | `whenAllDeckAttr` | 自己強化・相手半減を含む変化は観測。最大HP・現在HP処理に疑義 |
| #264 ◎スネグラチカ | partial | `multiplyEquipmentBonus` | 装備守備強化+85600の表示。元装備値と倍率の独立検算不足 |
| #284 オジ＆オバ・ナベリウス | partial | `stealHighestToDefense` | 攻撃-23505／守備+23505の移転表示。80%基準を独立検算できない |
| #307 ナイトメア | partial | `nightmareOwnRemoveDp` | 攻撃12799→153588等12倍の2件。消去デビルのDP合計は未照合 |
| #311 ウヴァル＆ファタ・モルガナ | provisional | **手書き個別処理** | 元装備補正の繰り返し減算を報告・照合。自己攻撃増加等の全挙動未照合 |
| #368 オドラデク | legacy | **手書き個別処理** | 装備無効化後の能力発動を観測。閾値の参照先は未確定 |
| #378 雪崩を切り裂くルシファー | provisional | **手書き個別処理** | ルシファーの発動と召喚予約取消らしい分岐を観測。3倍減算の基準不明 |


### 今は原作観測を紐づけられていない340体

以前に戦ったことがないとは言えない。手持ちログや元資料から証拠を追加する。

| ID・デビル | モデル | 共通演算（上位） | 原作観測と未確定条件 |
|---|---|---|---|

| #2 ガミジン | partial | `noAttack`＋`instantKillChance` | 観測の対応付け未了 |
| #4 ウァレフォル | partial | `damage` | 観測の対応付け未了 |
| #5 バルバトス | description | `transfer` | 観測の対応付け未了 |
| #6 ブエル | partial | `set`＋`damage` | 観測の対応付け未了 |
| #7 グシオン | partial | `tempMultiply`＋`evade` | 観測の対応付け未了 |
| #8 シトリー | description | `multiply` | 観測の対応付け未了 |
| #9 ベレト | partial | `tempSet` | 観測の対応付け未了 |
| #10 レライエ | partial | `tempSet` | 観測の対応付け未了 |
| #11 バティン | description | `add` | 観測の対応付け未了 |
| #12 サレオス | description | `multiply` | 観測の対応付け未了 |
| #13 プルソン | partial | `chanceEvade` | 観測の対応付け未了 |
| #15 アイム | description | `add` | 観測の対応付け未了 |
| #16 ナベリウス | partial | `destroyEnemy`＋`multiply`＋`noAttack` | 観測の対応付け未了 |
| #17 アスモデウス | partial | `set`＋`noAttack` | 観測の対応付け未了 |
| #18 ガープ | partial | `chanceSwap` | 観測の対応付け未了 |
| #19 フルフル | partial | `damage` | 観測の対応付け未了 |
| #20 マルコシアス | description | `multiply` | 観測の対応付け未了 |
| #22 フェニックス | partial | `multiply`＋`magicHit` | 観測の対応付け未了 |
| #23 ハルファス | description | `transfer` | 観測の対応付け未了 |
| #24 マルファス | description | `transfer` | 観測の対応付け未了 |
| #25 ラウム | description | `transfer` | 観測の対応付け未了 |
| #27 ウェパル | partial | `set`＋`damage` | 観測の対応付け未了 |
| #28 シャックス | description | `reset` | 観測の対応付け未了 |
| #29 ビフロンス | partial | `damageLastHit` | 観測の対応付け未了 |
| #30 クロケル | description | `add` | 観測の対応付け未了 |
| #31 フルカス | description | `suppressEnemy`＋`multiply` | 観測の対応付け未了 |
| #32 オロバス | partial | `add` | 観測の対応付け未了 |
| #33 グレモリー | description | `suppressEnemy`＋`set` | 観測の対応付け未了 |
| #34 オセ | description | `reset` | 観測の対応付け未了 |
| #35 ウァプラ | description | `multiply` | 観測の対応付け未了 |
| #36 アンドラス | partial | `assistThreshold` | 観測の対応付け未了 |
| #37 ベリアル | description | `multiply` | 観測の対応付け未了 |
| #38 デカラビア | partial | `multiply`＋`damage` | 観測の対応付け未了 |
| #39 ダンタリオン | partial | `chanceMagic` | 観測の対応付け未了 |
| #42 ゼパル | partial | `whenEnemyAttr` | 観測の対応付け未了 |
| #43 ボティス | partial | `suppressEnemy`＋`set` | 観測の対応付け未了 |
| #44 グラシャ＝ラボラス | partial | `multiply` | 観測の対応付け未了 |
| #45 サブナック | partial | `whenEnemyAttr` | 観測の対応付け未了 |
| #47 バラム | legacy | **手書き個別処理** | 観測の対応付け未了 |
| #48 アロケル | partial | `multiply`＋`tempMultiply`＋`allocesAfter` | 観測の対応付け未了 |
| #49 カイム | description | `multiply` | 観測の対応付け未了 |
| #50 ザガン | description | `multiply`＋`set` | 観測の対応付け未了 |
| #51 ウァラク | partial | `ifPreviousDevil` | 観測の対応付け未了 |
| #52 フラウロス | partial | `ifPreviousDevil` | 観測の対応付け未了 |
| #53 アムドゥスキアス | partial | `multiply`＋`magicHit`＋`whenEnemyAttr` | 観測の対応付け未了 |
| #54 サキュバス | partial | `orderHighestBuff` | 観測の対応付け未了 |
| #55 ベリト | partial | `stealEnemyMagicToHp`＋`startMagic` | 観測の対応付け未了 |
| #57 キマリス | description | `multiply` | 観測の対応付け未了 |
| #58 アスタロト | partial | `chanceMagic`＋`whenEnemyAttr` | 観測の対応付け未了 |
| #61 アンドロマリウス | description | `multiply` | 観測の対応付け未了 |
| #62 アミー | partial | `tempMultiply` | 観測の対応付け未了 |
| #63 ブネ | description | `subtract`＋`noAttack` | 観測の対応付け未了 |
| #65 オリアス | partial | `magicCompareSwapHp` | 観測の対応付け未了 |
| #66 ムルムル | description | `reset` | 観測の対応付け未了 |
| #67 ノロウェ | partial | `cancelMagic`＋`tempMultiply` | 観測の対応付け未了 |
| #68 アガレス | description | `transfer` | 観測の対応付け未了 |
| #69 クロネコ | partial | `ifPreviousDevil` | 観測の対応付け未了 |
| #70 シロネコ | partial | `ifPreviousDevil` | 観測の対応付け未了 |
| #71 フォルネウス | partial | `multiply` | 観測の対応付け未了 |
| #72 シルフェ | description | `swap` | 観測の対応付け未了 |
| #73 イボス | partial | `whenSelfGreater` | 観測の対応付け未了 |
| #74 ラナリル | description | `swap` | 観測の対応付け未了 |
| #75 サロメ | partial | `damage`＋`noAttack` | 観測の対応付け未了 |
| #76 セエレ | description | `set` | 観測の対応付け未了 |
| #77 ○ファリニシュ | partial | `destroyEnemy`＋`multiply` | 観測の対応付け未了 |
| #78 マリア・グァッゾ | description | `stopTurn` | 観測の対応付け未了 |
| #79 アンドレアルフス | description | `subtract` | 観測の対応付け未了 |
| #80 レヴィアタン | description | `swap` | 観測の対応付け未了 |
| #81 ○死 | partial | `instantKillChance`＋`noAttack` | 観測の対応付け未了 |
| #82 ○再生 | description | `reset` | 観測の対応付け未了 |
| #84 ベルフェゴール | description | `blockDevil`＋`add` | 観測の対応付け未了 |
| #85 モロク | partial | `setEnemyHighest`＋`noAttack` | 観測の対応付け未了 |
| #86 ジャックオランタン | partial | `selfMinToEnemyMax` | 観測の対応付け未了 |
| #87 ◎アリサ・ウィッチハート | partial | `destroyAllEnemyAttr` | 観測の対応付け未了 |
| #88 ルキフグス | partial | `destroyAllEnemyAttr` | 観測の対応付け未了 |
| #89 ルシファー | partial | `restoreIfBelow` | 観測の対応付け未了 |
| #91 ○クランプス | partial | `damage` | 観測の対応付け未了 |
| #92 サマエル | partial | `destroyAllEnemyAttr` | 観測の対応付け未了 |
| #93 フォラス | partial | `absorbNormalAttack`＋`noAttack` | 観測の対応付け未了 |
| #95 トミドゥコロ | partial | `chanceBlockEnemyAttack` | 観測の対応付け未了 |
| #96 ◎コ・ナベリウス | partial | `ifPreviousDevil` | 観測の対応付け未了 |
| #97 バフォメット | legacy | **手書き個別処理** | 観測の対応付け未了 |
| #98 ○ブリギット | partial | `forceFirst` | 観測の対応付け未了 |
| #99 シュプレンゲル＆クラメル | description | `subtract`＋`noAttack` | 観測の対応付け未了 |
| #101 アウリス | description | `swap` | 観測の対応付け未了 |
| #102 ○オスタル | partial | `baseDefenseCompareAbsorb` | 観測の対応付け未了 |
| #103 ◎命を宿すオスタル | partial | `swapSelfMinEnemyMax` | 観測の対応付け未了 |
| #105 インキュバス | partial | `incubusStatChange` | 観測の対応付け未了 |
| #106 ベヒーモス | partial | `genderConditional` | 観測の対応付け未了 |
| #108 黒い雌鶏 | partial | `stealAssistStats` | 観測の対応付け未了 |
| #109 ◎ツマ・ナベリウス | partial | `tsumaNaberius` | 観測の対応付け未了 |
| #110 ファタ・モルガナ | description | `add`＋`set` | 観測の対応付け未了 |
| #111 チェシャ猫 | partial | `cheshireCat` | 観測の対応付け未了 |
| #112 ニスロク | description | `transfer` | 観測の対応付け未了 |
| #113 マウ・ビート | partial | `thresholdSet`＋`noAttack` | 観測の対応付け未了 |
| #114 クラリッサ | partial | `set`＋`noAttack` | 観測の対応付け未了 |
| #116 ○ラマンダラ | partial | `destroyAllEnemyAttr` | 観測の対応付け未了 |
| #117 アザゼル | partial | `swapHighestLowest` | 観測の対応付け未了 |
| #118 マンモン | partial | `whenHour` | 観測の対応付け未了 |
| #120 ◎隠された長腕のルー | partial | `multiply`＋`farinishMagicBoost`＋`magicHit` | 観測の対応付け未了 |
| #121 タイタニア | partial | `titaniaWaterFire` | 観測の対応付け未了 |
| #122 オベロン | partial | `oberonTime` | 観測の対応付け未了 |
| #123 ケット・シー | partial | `catSidhe` | 観測の対応付け未了 |
| #124 アリトン | partial | `multiply` | 観測の対応付け未了 |
| #126 オリエンス | partial | `forceFirst`＋`chanceBlockEnemyAttack` | 観測の対応付け未了 |
| #127 アグライア | partial | `reviveOnce` | 観測の対応付け未了 |
| #128 サリエル | partial | `destroyAllEnemyAttr` | 観測の対応付け未了 |
| #129 マスティマ | partial | `add`＋`mastimaBeelzebub` | 観測の対応付け未了 |
| #130 スワニール | partial | `enemyAttackToHp`＋`noAttack` | 観測の対応付け未了 |
| #132 ロゼッタ | partial | `subtract` | 観測の対応付け未了 |
| #133 ライブラ | partial | `libraLevel` | 観測の対応付け未了 |
| #134 ◎パンプキィ・パンピキィ | description | `add` | 観測の対応付け未了 |
| #135 ◎ユースティティアのウサギ | partial | `forceFirst` | 観測の対応付け未了 |
| #136 ヴィヴィアン | description | `set`＋`noAttack` | 観測の対応付け未了 |
| #138 アナト | partial | `attackAgain` | 観測の対応付け未了 |
| #139 ネフィリム | partial | `shuffleEnemyStats` | 観測の対応付け未了 |
| #140 ◎オジ・ナベリウス | partial | `ojiNaberius` | 観測の対応付け未了 |
| #141 ◎ディアーナ | description | **手書き個別処理** | 観測の対応付け未了 |
| #144 マゴト | description | `damage`＋`noAttack` | 観測の対応付け未了 |
| #145 ◎オスタルの巫女 | description | `add`＋`multiply` | 観測の対応付け未了 |
| #146 ◎舞いながら戦うオスタルの巫女 | partial | `stealExcessInitial` | 観測の対応付け未了 |
| #147 アマイモン | partial | `randomEnemyBaseToHp` | 観測の対応付け未了 |
| #149 リリス | description | `swap` | 観測の対応付け未了 |
| #150 アリアンロッド | partial | `equipmentSubtractScaled`＋`noAttack` | 観測の対応付け未了 |
| #151 ジャックフロスト | partial | `whenEnemyAttr` | 観測の対応付け未了 |
| #152 ニンフ | description | `damage` | 観測の対応付け未了 |
| #153 ◎メイ・ナベリウス | partial | `multiply` | 観測の対応付け未了 |
| #154 ウコバク | description | `multiply` | 観測の対応付け未了 |
| #155 バラキエル | description | `swap` | 観測の対応付け未了 |
| #156 ライラ・ケプルス | description | `multiply` | 観測の対応付け未了 |
| #157 ドリドルム | partial | `stealAttackLeaveOne` | 観測の対応付け未了 |
| #158 アンナ・ケプルス | partial | `sacrificeStatToHp` | 観測の対応付け未了 |
| #159 アネッタ | partial | `secondLowestDebuff` | 観測の対応付け未了 |
| #160 ニーナ・ケプルス | partial | `set` | 観測の対応付け未了 |
| #161 ロル・ナイトメア | partial | `secondHighestDebuff`＋`noAttack` | 観測の対応付け未了 |
| #162 ナルキッソス | legacy | **手書き個別処理** | 観測の対応付け未了 |
| #163 ◎パパ・ナベリウス | partial | `multiply` | 観測の対応付け未了 |
| #164 スカアハ | description | `swap` | 観測の対応付け未了 |
| #165 ダゴン | description | `damage` | 観測の対応付け未了 |
| #166 ノーム | partial | `add` | 観測の対応付け未了 |
| #167 アバドン | description | **手書き個別処理** | 観測の対応付け未了 |
| #168 ドリー・J | description | `transfer` | 観測の対応付け未了 |
| #169 アンドラメレク | description | `add` | 観測の対応付け未了 |
| #170 ◎クー・フーリン | partial | `destroyEnemy`＋`damage` | 観測の対応付け未了 |
| #171 ウロボロス | description | `attackTurnBoost` | 観測の対応付け未了 |
| #172 善良なマンドラゴラ | partial | `mandragoraFirstSecond` | 観測の対応付け未了 |
| #173 ◎誕生 | partial | `set`＋`setEnemyInitialMagic`＋`suppressEnemy` | 観測の対応付け未了 |
| #174 ◎消滅 | partial | `destroyBothDevilsForTurns` | 観測の対応付け未了 |
| #175 クランメリア | partial | `multiply`＋`evade` | 観測の対応付け未了 |
| #176 ムブラン | partial | `randomChoice` | 観測の対応付け未了 |
| #177 ティナ・スピアーナ | partial | `addOwnTotalDpToStat` | 観測の対応付け未了 |
| #178 ケンタウロス | partial | `externalLvDpDamage`＋`noAttack` | 観測の対応付け未了 |
| #180 リドル・クラウン | partial | `swapHighestLowest` | 観測の対応付け未了 |
| #181 ◎邪悪なマンドラゴラ | description | `add`＋`subtract` | 観測の対応付け未了 |
| #182 リャナンシー | partial | `cureReflectConfuse`＋`multiply` | 観測の対応付け未了 |
| #183 クイーンピケル | partial | `ifMagicActiveThen` | 観測の対応付け未了 |
| #184 シェミハザ | description | `rotateEnemy` | 観測の対応付け未了 |
| #186 ◎ワイルドハント | partial | `multiply` | 観測の対応付け未了 |
| #187 アルマロス | partial | `stealEquipmentHalf` | 観測の対応付け未了 |
| #188 ルサールカ | partial | `magicRatioForceFirst` | 観測の対応付け未了 |
| #189 デュラハン | description | `sacrificeHp` | 観測の対応付け未了 |
| #190 スプリガン | partial | `sprigganGuard` | 観測の対応付け未了 |
| #191 ノッカー | description | `damage`＋`set` | 観測の対応付け未了 |
| #194 ネビロス | partial | `swap`＋`reflect` | 観測の対応付け未了 |
| #195 バロール | partial | `suppressEnemy`＋`transfer` | 観測の対応付け未了 |
| #196 エウリノーム | description | `set` | 観測の対応付け未了 |
| #197 ペア・フォルター | partial | `reduceEnemyDefenseLastHit` | 観測の対応付け未了 |
| #199 デコラ・フォルター | partial | `instantKillChanceFromDP`＋`noAttack` | 観測の対応付け未了 |
| #200 サタン | partial | `scheduleDeathCurse` | 観測の対応付け未了 |
| #201 ガルガメル | partial | `deckCountAttackBoost` | 観測の対応付け未了 |
| #202 シャムシェル | partial | `shamshelDp` | 観測の対応付け未了 |
| #203 ハッグ | partial | `copyEnemyPositiveBoosts` | 観測の対応付け未了 |
| #204 ヴェスティア | partial | `enemyTotalDpDamage` | 観測の対応付け未了 |
| #205 ◎レブナント | partial | `restoreRemovedDevils` | 観測の対応付け未了 |
| #206 メロウ | description | `set`＋`add` | 観測の対応付け未了 |
| #207 ヴァルキリー | partial | `deckCountDamage`＋`noAttack` | 観測の対応付け未了 |
| #208 ◎ハトホラ | partial | `attackAgain` | 観測の対応付け未了 |
| #209 ハール・ベル | description | `multiply` | 観測の対応付け未了 |
| #210 エゼキエル | partial | `setEnemyHighest`＋`setTwoLowestSelf` | 観測の対応付け未了 |
| #211 メリュジーヌ | partial | `reduceDamage` | 観測の対応付け未了 |
| #212 ギリードゥー | partial | `reduceDamage` | 観測の対応付け未了 |
| #214 マニ・エリ | partial | `damage` | 観測の対応付け未了 |
| #216 アリオーシュ | partial | `damageTakenBoost` | 観測の対応付け未了 |
| #217 メドゥーサ | partial | `suppressEnemy`＋`noAttack`＋`set` | 観測の対応付け未了 |
| #218 ロッゲンメーメ | description | `subtract` | 観測の対応付け未了 |
| #219 ザントメンヒェン | description | `add` | 観測の対応付け未了 |
| #220 ネルガル | description | `add` | 観測の対応付け未了 |
| #221 ネモフィラ | partial | `nemophilaSwapNext` | 観測の対応付け未了 |
| #222 ◎ソラト | partial | `registerEndOfTurnStatGrowth`＋`noAttack` | 観測の対応付け未了 |
| #223 ファフナー | partial | `noAttack`＋`tempMultiply` | 観測の対応付け未了 |
| #224 エニグマ | partial | `randomStatTriple` | 観測の対応付け未了 |
| #225 ナナ | partial | `nanaAttrDestroyDamage`＋`noAttack` | 観測の対応付け未了 |
| #226 アエロー | partial | `attackHalfToEnemyAndConfuse` | 観測の対応付け未了 |
| #227 ペリュトン | description | `add` | 観測の対応付け未了 |
| #228 ネミッサ | partial | `nemissaHarmonics`＋`noAttack` | 観測の対応付け未了 |
| #229 ロスメルタ | partial | `dpCompareBoost` | 観測の対応付け未了 |
| #230 バステト | partial | `swapEquipmentStats` | 観測の対応付け未了 |
| #232 ヘカート | partial | `suppressEnemy`＋`higherLowerHeal` | 観測の対応付け未了 |
| #233 プリンセス・パンプキン | partial | `randomChoice` | 観測の対応付け未了 |
| #234 ガーゴイル | partial | `noAttack`＋`transfer` | 観測の対応付け未了 |
| #235 グザファン | partial | `harmonicsComparison` | 観測の対応付け未了 |
| #236 デル・グレネ | partial | `nameLengthCompare` | 観測の対応付け未了 |
| #237 プーカ | partial | `goldCompareBuff` | 観測の対応付け未了 |
| #238 ウルド | partial | `magicOrDestroy` | 観測の対応付け未了 |
| #239 ヴェルダンディ | partial | `multiply` | 観測の対応付け未了 |
| #241 ◎ブラト | partial | `multiply` | 観測の対応付け未了 |
| #243 ディスコルディア | partial | `deletedDevilCountBoost` | 観測の対応付け未了 |
| #244 ラジエル | partial | `magicHalfAllStats`＋`assistCompareDestroyNext` | 観測の対応付け未了 |
| #245 ア・パオ・ア・クゥー | description | `sharedMagicHit` | 観測の対応付け未了 |
| #246 バルト・アンデルス | partial | `multiply`＋`clearEnemyForcedFirst` | 観測の対応付け未了 |
| #247 アルルーナ | partial | `chanceMagicConfuse` | 観測の対応付け未了 |
| #248 ◎ブリューナク | partial | `damageThisTurnDouble` | 観測の対応付け未了 |
| #249 トール | partial | `cureStatuses` | 観測の対応付け未了 |
| #250 タングニョースト | partial | `stealHpToAttack` | 観測の対応付け未了 |
| #251 タングリスニル | partial | `multiply`＋`reduceDamage` | 観測の対応付け未了 |
| #252 ナハトマート | partial | `tempMultiply` | 観測の対応付け未了 |
| #253 ミノタウロス | partial | `multiply` | 観測の対応付け未了 |
| #254 ウプイリ | partial | `registerEnemyAllStatDrain` | 観測の対応付け未了 |
| #256 モイラ | partial | `moiraConditional` | 観測の対応付け未了 |
| #257 ルサリィ | partial | `multiply` | 観測の対応付け未了 |
| #258 ネメシス | partial | `rankDamage` | 観測の対応付け未了 |
| #259 エポナ | partial | `externalScaledAdd` | 観測の対応付け未了 |
| #260 党首の威光を放つベレト | description | **手書き個別処理** | 観測の対応付け未了 |
| #261 ゴヴニュ | partial | `externalRankBoost` | 観測の対応付け未了 |
| #262 ラミアー | partial | `darkDeckDestroyCount` | 観測の対応付け未了 |
| #263 容赦ない一撃を放つスカアハ | partial | `swap`＋`confuse`＋`noAttack` | 観測の対応付け未了 |
| #265 ◎鮮血を浴びたクランプス | legacy | **手書き個別処理** | 観測の対応付け未了 |
| #266 轟雷の矢を放つレライエ | description | `set` | 観測の対応付け未了 |
| #267 暴風吹き荒れるムルムル | description | `set` | 観測の対応付け未了 |
| #268 聖杯を抱くウェパル | partial | `set`＋`damage` | 観測の対応付け未了 |
| #269 オイフェ | description | `swap` | 観測の対応付け未了 |
| #270 モルペウス | partial | `set`＋`noAttack` | 観測の対応付け未了 |
| #271 ◎春を喜ぶブリギット | description | **手書き個別処理** | 観測の対応付け未了 |
| #272 蝶と舞い踊るマリア・グァッゾ | partial | `stopTurn`＋`forceFirst` | 観測の対応付け未了 |
| #273 サイクロプス | description | `multiply` | 観測の対応付け未了 |
| #274 バジリスク | description | `multiply`＋`noAttack` | 観測の対応付け未了 |
| #275 エイル | description | `restoreIfBelow` | 観測の対応付け未了 |
| #276 セイレーン | partial | `noAttack`＋`confuse`＋`deckCountBoost` | 観測の対応付け未了 |
| #277 記憶を取り戻したアミー | partial | `multiply` | 観測の対応付け未了 |
| #278 法を改訂するバフォメット | description | `set`＋`noAttack` | 観測の対応付け未了 |
| #279 永遠を灯すアスモデウス | description | `set` | 観測の対応付け未了 |
| #280 夜空に羽撃くスワニール | description | `transferExcess` | 観測の対応付け未了 |
| #281 春風に舞うグシオン | partial | `attributeKindsBoost` | 観測の対応付け未了 |
| #282 アルミラージ | partial | `multiply` | 観測の対応付け未了 |
| #283 ニュクス | partial | `firstOrSecondBuff` | 観測の対応付け未了 |
| #286 キキーモラ | partial | `kikimora` | 観測の対応付け未了 |
| #288 オピーオン | partial | `blockEnemyAttackFuture` | 観測の対応付け未了 |
| #289 ゴリラを連れたケット・シー | partial | `multiply` | 観測の対応付け未了 |
| #290 祈りを捧げるモラクス | partial | `registerEndOfTurnStatGrowth` | 観測の対応付け未了 |
| #293 ヴォジャノーイ | partial | `destroyByAttrAndBoost` | 観測の対応付け未了 |
| #294 ルナ・スピアーナ | partial | `noAttack`＋`extraAttackAtEnd` | 観測の対応付け未了 |
| #296 ひまわりワンピを着たサレオス | description | `multiply` | 観測の対応付け未了 |
| #297 両脚で立つレヴィアタン | partial | `swapSelfMinEnemyStat` | 観測の対応付け未了 |
| #298 ニコラス・レミ | description | `destroyEnemy`＋`set`＋`noAttack` | 観測の対応付け未了 |
| #299 アングルボザ | partial | `assistMultiplier` | 観測の対応付け未了 |
| #301 ルゲイエ | partial | `assistCountBoost` | 観測の対応付け未了 |
| #302 ナイトストーク | partial | `nightstalkDeck` | 観測の対応付け未了 |
| #303 ◎カリアッハベーラ | partial | `noAttack`＋`blockEnemyAttackFuture` | 観測の対応付け未了 |
| #304 造物主の水・ユースティティアのウサギ | partial | `set` | 観測の対応付け未了 |
| #305 イピリア | partial | `assistCompareEvade` | 観測の対応付け未了 |
| #306 マクスウェル | partial | `swapOtherSlots` | 観測の対応付け未了 |
| #308 冥雷を振りかざすスカアハ | description | `multiply` | 観測の対応付け未了 |
| #309 フェンリル | partial | `fenrirRandomAttack` | 観測の対応付け未了 |
| #310 パーン | partial | `swap`＋`stopTurn` | 観測の対応付け未了 |
| #312 モルモル | description | `magicToAttack` | 観測の対応付け未了 |
| #313 フレイ | partial | `registerEndOfTurnStatGrowth` | 観測の対応付け未了 |
| #314 祈りを捧げるガミジン | partial | `noAttack`＋`instantKillChance` | 観測の対応付け未了 |
| #315 ベローナ | description | `add` | 観測の対応付け未了 |
| #316 ジェントルマン | partial | `gentlemanRotate` | 観測の対応付け未了 |
| #317 イカロス | partial | `icarusExternal`＋`noAttack` | 観測の対応付け未了 |
| #320 ヨルムンガンド | partial | `reduceDamage` | 観測の対応付け未了 |
| #321 コッペリア | partial | `coppeliaDoll` | 観測の対応付け未了 |
| #322 虚の扉を開くモロク | partial | `setEnemyHighest`＋`noAttack`＋`blockEnemyAttackFuture` | 観測の対応付け未了 |
| #323 ライフセーバー・サブナック | description | `set` | 観測の対応付け未了 |
| #324 アラクネ | partial | `highestStealToHp` | 観測の対応付け未了 |
| #325 哲学者の土・善良なマンドラゴラ | partial | `mandragoraEarth` | 観測の対応付け未了 |
| #326 砂浜剣舞バアル | partial | `tempMultiply`＋`multiply` | 観測の対応付け未了 |
| #327 モノケロス | partial | `registerEndOfTurnStatGrowth` | 観測の対応付け未了 |
| #328 ヒュギエイア | partial | `registerEndOfTurnStatGrowth` | 観測の対応付け未了 |
| #329 王の風・グシオン | partial | `attributeKindsBoost`＋`noAttack`＋`blockEnemyAttackFuture` | 観測の対応付け未了 |
| #330 未来へ誘うアンドラメレク | description | `add`＋`subtract` | 観測の対応付け未了 |
| #331 かぼちゃを投げ落とすシャックス | description | `reset`＋`damage` | 観測の対応付け未了 |
| #332 アリエル | partial | `swap` | 観測の対応付け未了 |
| #333 ◎ジェド・マロース | partial | `multiplyEquipmentBonus` | 観測の対応付け未了 |
| #334 ソフィア | partial | `tempSet` | 観測の対応付け未了 |
| #335 アンリ・ボゲ | description | `destroyEnemy`＋`set`＋`noAttack` | 観測の対応付け未了 |
| #336 アブンディア | description | **手書き個別処理** | 観測の対応付け未了 |
| #337 ◎イースターバニー | description | `multiply`＋`noAttack` | 観測の対応付け未了 |
| #338 剣を手にしたジェントルマン | partial | `gentlemanRotate` | 観測の対応付け未了 |
| #339 セベク | description | `destroyEnemy`＋`add` | 観測の対応付け未了 |
| #340 クエレブレ＆シャナ | partial | `set` | 観測の対応付け未了 |
| #341 モロク・ハクタ・イオリニア | partial | `setEnemyHighest`＋`noAttack`＋`destroyEnemy` | 観測の対応付け未了 |
| #342 巡り会うシャムシェル | partial | `shamshelVariantDp` | 観測の対応付け未了 |
| #343 祝福されたオセ | partial | `resetAllEnemyStats`＋`set` | 観測の対応付け未了 |
| #344 バイア | partial | `ifEnemyAttrSteal` | 観測の対応付け未了 |
| #345 サマーバケーション・ファタ・モルガナ | description | `add`＋`multiply` | 観測の対応付け未了 |
| #346 終わりなき夜・ロキ | partial | `whenAllDeckAttr` | 観測の対応付け未了 |
| #348 バラム・アスタルイズ | description | `destroyEnemy`＋`multiply` | 観測の対応付け未了 |
| #349 バンシー | description | `transfer` | 観測の対応付け未了 |
| #350 スノトラ | description | `multiply` | 観測の対応付け未了 |
| #351 マンドラ・ゴブリン | partial | `transfer` | 観測の対応付け未了 |
| #352 弓月・ニ・ソグ・シオン | partial | `stealEnemyAllToAttack`＋`noAttack` | 観測の対応付け未了 |
| #353 フローラ | partial | `ifEnemyAttrSteal` | 観測の対応付け未了 |
| #355 ユミール | partial | `stealEnemyAllToHp`＋`noAttack` | 観測の対応付け未了 |
| #356 桜珊瑚の森に立つアリトン | partial | `multiply` | 観測の対応付け未了 |
| #357 微笑みをこぼすペア・フォルター | partial | `boostDefenseLastHit` | 観測の対応付け未了 |
| #358 密かに微笑むブランド・フォルター | provisional | **手書き個別処理** | 観測の対応付け未了 |
| #359 微笑み忘れたデコラ・フォルター | partial | `dpBasedHpBoost` | 観測の対応付け未了 |
| #360 フギン | partial | `multiplyEquipmentBonus` | 観測の対応付け未了 |
| #361 フォルトゥナ | partial | `randomStatAdd` | 観測の対応付け未了 |
| #362 マイノール・デュラハン | partial | `sacrificeHp` | 観測の対応付け未了 |
| #363 ムニン | partial | `multiplyEquipmentBonus` | 観測の対応付け未了 |
| #364 原初の光・アグライア | partial | `multiply`＋`reviveOnce` | 観測の対応付け未了 |
| #365 シルキー | partial | `multiply` | 観測の対応付け未了 |
| #367 ギーブル | description | `add` | 観測の対応付け未了 |
| #369 夜へと誘うアミー | description | `multiply` | 観測の対応付け未了 |
| #370 ヴィドフニル＆コゼット | description | `swap` | 観測の対応付け未了 |
| #371 四月島にいたヴィドフニル | description | `swap` | 観測の対応付け未了 |
| #372 レディ・アルミラージ | partial | `multiply` | 観測の対応付け未了 |
| #373 夜に涼むオリアス | description | `swap` | 観測の対応付け未了 |
| #374 賢者の火・ベリト | partial | `stealEnemyMagicToHp`＋`startMagic` | 観測の対応付け未了 |
| #375 若き日のジョン＆メアリー | partial | `ifSelfMagicBelow` | 観測の対応付け未了 |
| #376 エルズリー | partial | `externalScaledAdd` | 観測の対応付け未了 |
| #377 ◎時を駆けるヴィネ | partial | `repeatPrevious`＋`resetEnemyAttack` | 観測の対応付け未了 |
| #379 握手を求めるチェシャ猫 | partial | `noAttack`＋`destroyEnemy` | 観測の対応付け未了 |
| #380 満面の笑みを讃えるミノタウロス | partial | `add`＋`noAttack` | 観測の対応付け未了 |
| #381 謹賀新年・アリエル | description | **手書き個別処理** | 観測の対応付け未了 |
| #382 エルピオーネ婦妻 | partial | `multiply`＋`reviveOnce` | 観測の対応付け未了 |
| #383 哲学者の土・ミノタウロス | partial | `multiply` | 観測の対応付け未了 |
| #384 入浴中・ナルキッソス | partial | `add`＋`noAttack` | 観測の対応付け未了 |
| #385 両手を広げるマルコシアス | partial | `multiply` | 観測の対応付け未了 |
| #387 ミスティ | partial | `multiply`＋`evade` | 観測の対応付け未了 |
| #388 終わりなき夜・ビフロンス | partial | `destroyEnemy`＋`damageLastHit` | 観測の対応付け未了 |
| #390 ベッドに誘うマルコシアス | description | `multiply` | 観測の対応付け未了 |
| #391 原初の光・マクスウェル | partial | `swapOtherSlots` | 観測の対応付け未了 |
| #392 乾杯するペア・フォルター | partial | `reduceEnemyDefenseLastHit` | 観測の対応付け未了 |
| #393 シャンパンを開けるアンリ・ボゲ | description | `destroyEnemy`＋`set`＋`noAttack` | 観測の対応付け未了 |
| #394 真夜中のマンモン | partial | `whenHour` | 観測の対応付け未了 |
| #395 人形を作るコッペリア | partial | `coppeliaDoll` | 観測の対応付け未了 |
| #396 料理をするニスロク | description | `transfer` | 観測の対応付け未了 |


## 6. 実験を減らす運用

1. **まずI**：共通演算の計算境界（正負・0・切捨て・初期値／現在値）はユニットテストへ。自動化できる部分のために相手選別や先攻抽選をしない。
2. **次にS**：原作図鑑の能力文にある係数・対象・時期・持続・条件を、そのデビルの実装データへ突き合わせる。ここはゲーム内バトルがなくてもかなり確認可能。
3. **Lの再利用**：Aや既存verifiedを、主経路の試験のために一律に再戦させない。Bは既に分かった効果を固定し、不足した値だけ狙う。
4. **Cは資料探索先行**：過去ログで脇役デビルの出現・能力変化を探す。それでも不明で、戦術上重要なものだけ原作で検証する。
5. **Xは優先付け**：特殊即死・再生、時間巻戻し、未来枠、召喚予約、行動阻止、魔力戦ダメージ、装備処理、負値は、勝敗や大規模な連鎖へ影響する場合に調査する。

ここで数値を**384→167件の新規模擬戦**などと置換してはならない。**共通コードの検査件数と原作での試験件数は異なる単位**だからだ。

## 7. データと証拠の参照元

- [実装状態](../../dist/engine-status.json)、[原作デビル図鑑](../../dist/devils.json)
- [宣言的ルール](../src/kei_batch_rules_0048.js)、[エンジン（004.8）](../src/kei_unified_engine_v0_4_8.js)
- [過去ログ再監査（27＋17）](2026-11-14-validation-reconciled-from-logs.md)、[最初の384体候補](2026-11-14-validation-candidates-384.md)
- [アラストル](2026-11-14-alastor-observed-rule.md)、[シュレディンガー](2026-11-14-schrodinger-tests.md)、[ヘル・モーラ](2026-11-14-mora-hel-temporal.md)、[ヴィドフニル](2026-11-14-vidofnir-assist-equipment.md)
- Project原資料 `四月島・解析ノートv0.8.md`。逐語ログをGitHubに再掲載せず、既存研究ノートの節番号と観測内容を証拠リンクとして利用する。

**制限**：この対応表は現行実装と既存の研究記録から作成した**検証計画用マップ**。今回の作業で実戦ログを新たに生成したり、340体に未観測の認定を下したりしたわけではない。

