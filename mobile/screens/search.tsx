import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Searchbar as PaperSearchbar, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { cliquesService } from "../services";
import usersService from "@services/users.service";
import { showError } from "../store/app.store";
import { Clique, User, Occupation, ScreenNavigationProp } from "../types";
import { useAuthStore } from "../store/auth.store";

const { width, height } = Dimensions.get("window");

type SearchCategory = "all" | "Occupation" | "Persons" | "Cliques";

interface SearchItem {
  id: number;
  name?: string;
  username?: string;
  type: "Occupation" | "User" | "Clique";
}

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<ScreenNavigationProp<"Search">>();
  const user = useAuthStore((state) => state.user);

  const [search, setSearch] = useState<string>("");
  const [filteredDataSource, setFilteredDataSource] = useState<SearchItem[]>(
    [],
  );
  const [masterDataSource, setMasterDataSource] = useState<Occupation[]>([]);
  const [cliques, setCliques] = useState<Clique[]>([]);
  const [userList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [category, setCategory] = useState<SearchCategory>("all");

  // Fetch cliques
  const getCliques = async () => {
    try {
      const data = await cliquesService.getAllCliques();
      setCliques(data);
    } catch (error) {
      console.error("Error fetching cliques:", error);
      showError("Failed to load cliques");
    }
  };

  // Fetch users
  const getUsers = async () => {
    try {
      const users = await usersService.getAllUsers();
      setUsersList(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      showError("Failed to load users");
    }
  };

  // Fetch occupations
  const getOccupations = async () => {
    try {
      const occupations = await usersService.getOccupations();
      setMasterDataSource(occupations);
    } catch (error) {
      console.error("Error fetching occupations:", error);
      showError("Failed to load occupations");
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([getCliques(), getUsers(), getOccupations()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update filtered data when category changes or data loads
  useEffect(() => {
    if (category === "all") {
      const allData: SearchItem[] = [
        ...masterDataSource.map((item) => ({
          ...item,
          type: "Occupation" as const,
        })),
        ...userList.map((user) => ({
          id: user.id,
          username: user.username,
          type: "User" as const,
        })),
        ...cliques.map((clique) => ({
          id: clique.id,
          name: clique.name,
          type: "Clique" as const,
        })),
      ];
      setFilteredDataSource(allData);
    }
  }, [masterDataSource, userList, cliques, category]);

  // Search filter function
  const searchFilterFunction = (text: string) => {
    if (text) {
      let newData: SearchItem[] = [];

      if (category === "all") {
        newData = [
          ...masterDataSource
            .filter((item) =>
              item.name.toUpperCase().includes(text.toUpperCase()),
            )
            .map((item) => ({ ...item, type: "Occupation" as const })),
          ...userList
            .filter((user) =>
              user.username.toUpperCase().includes(text.toUpperCase()),
            )
            .map((user) => ({
              id: user.id,
              username: user.username,
              type: "User" as const,
            })),
          ...cliques
            .filter((clique) =>
              clique.name.toUpperCase().includes(text.toUpperCase()),
            )
            .map((clique) => ({
              id: clique.id,
              name: clique.name,
              type: "Clique" as const,
            })),
        ];
      } else if (category === "Occupation") {
        newData = masterDataSource
          .filter((item) =>
            item.name.toUpperCase().includes(text.toUpperCase()),
          )
          .map((item) => ({ ...item, type: "Occupation" as const }));
      } else if (category === "Persons") {
        newData = userList
          .filter((user) =>
            user.username.toUpperCase().includes(text.toUpperCase()),
          )
          .map((user) => ({
            id: user.id,
            username: user.username,
            type: "User" as const,
          }));
      } else if (category === "Cliques") {
        newData = cliques
          .filter((clique) =>
            clique.name.toUpperCase().includes(text.toUpperCase()),
          )
          .map((clique) => ({
            id: clique.id,
            name: clique.name,
            type: "Clique" as const,
          }));
      }

      setFilteredDataSource(newData);
      setSearch(text);
    } else {
      filterByCategory(category);
      setSearch(text);
    }
  };

  // Filter by category
  const filterByCategory = (selectedCategory: SearchCategory) => {
    setCategory(selectedCategory);
    if (selectedCategory === "all") {
      const allData: SearchItem[] = [
        ...masterDataSource.map((item) => ({
          ...item,
          type: "Occupation" as const,
        })),
        ...userList.map((user) => ({
          id: user.id,
          username: user.username,
          type: "User" as const,
        })),
        ...cliques.map((clique) => ({
          id: clique.id,
          name: clique.name,
          type: "Clique" as const,
        })),
      ];
      setFilteredDataSource(allData);
    } else if (selectedCategory === "Occupation") {
      const newData = masterDataSource.map((item) => ({
        ...item,
        type: "Occupation" as const,
      }));
      setFilteredDataSource(newData);
    } else if (selectedCategory === "Persons") {
      setFilteredDataSource(
        userList.map((user) => ({
          id: user.id,
          username: user.username,
          type: "User" as const,
        })),
      );
    } else if (selectedCategory === "Cliques") {
      setFilteredDataSource(
        cliques.map((clique) => ({
          id: clique.id,
          name: clique.name,
          type: "Clique" as const,
        })),
      );
    }
  };

  // Render item
  const renderItem = ({ item }: { item: SearchItem }) => {
    const displayName = item.type === "User" ? item.username : item.name;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          onPress={() => {
            switch (item.type) {
              case "Occupation":
                navigation.navigate("CliquesTab");
                break;
              case "User":
                navigation.navigate("ViewUser", { userId: item.id });
                break;
              case "Clique":
                navigation.navigate("CliquesTab", {
                  screen: "CliqueDetail",
                  params: { id: item.id },
                });
                break;
              default:
                navigation.navigate("Home");
                break;
            }
          }}
        >
          <Text style={styles.itemText}>{displayName || "Unnamed"}</Text>
          <Text style={styles.itemType}>{item.type}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6ba32d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PaperSearchbar
        style={styles.searchBar}
        placeholder="Search"
        value={search}
        onChangeText={searchFilterFunction}
      />

      <View style={styles.categoryContainer}>
        <Button
          mode={category === "all" ? "contained" : "outlined"}
          onPress={() => filterByCategory("all")}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          All
        </Button>
        <Button
          mode={category === "Occupation" ? "contained" : "outlined"}
          onPress={() => filterByCategory("Occupation")}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          Occupation
        </Button>
        <Button
          mode={category === "Persons" ? "contained" : "outlined"}
          onPress={() => filterByCategory("Persons")}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          Users
        </Button>
        <Button
          mode={category === "Cliques" ? "contained" : "outlined"}
          onPress={() => filterByCategory("Cliques")}
          color="#6ba32d"
          contentStyle={styles.buttonContent}
          style={styles.button}
        >
          Cliques
        </Button>
      </View>

      <FlatList
        data={filteredDataSource}
        keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: height * 0.08,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  searchBar: {
    marginHorizontal: width * 0.04,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.01,
  },
  itemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: width * 0.04,
    marginBottom: height * 0.01,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: {
    fontSize: width * 0.04,
    color: "#333333",
    fontWeight: "500",
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: height * 0.01,
    paddingHorizontal: width * 0.01,
  },
  button: {
    borderRadius: 20,
    paddingHorizontal: 0,
    marginRight: 1,
  },
  buttonContent: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  itemType: {
    fontSize: 14,
    color: "grey",
  },
});

export default SearchScreen;
