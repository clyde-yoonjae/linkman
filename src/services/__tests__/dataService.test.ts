import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getSettings,
  updateSettings,
  resetSettings,
  getCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
  getLinks,
  getLinkById,
  getLinksInCategory,
  addLink,
  updateLink,
  deleteLink,
  searchLinks,
  sortLinks,
  recordLinkAccess,
  DataServiceError,
} from "../dataService";
import {
  Settings,
  Category,
  Link,
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  isValidLinkArray,
} from "../../types/data";
import * as utils from "../../utils";

// AsyncStorage 모킹
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// utils 모킹
jest.mock("../../utils", () => ({
  generateId: jest.fn(),
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedUtils = utils as jest.Mocked<typeof utils>;

describe("DataService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).__DEV__ = true;
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();

    // generateId 기본 모킹
    mockedUtils.generateId.mockReturnValue("test-id");

    // AsyncStorage 기본 모킹 초기화
    mockedAsyncStorage.getItem.mockImplementation(() => Promise.resolve(null));
    mockedAsyncStorage.setItem.mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // SETTINGS 테스트
  // ==========================================================================

  describe("Settings", () => {
    describe("getSettings", () => {
      it("should return existing settings", async () => {
        const mockSettings: Settings = {
          ...DEFAULT_SETTINGS,
          isDarkMode: true,
        };

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockSettings)
        );

        const result = await getSettings();

        expect(mockedAsyncStorage.getItem).toHaveBeenCalledWith(
          STORAGE_KEYS.SETTINGS
        );
        expect(result).toEqual(mockSettings);
      });

      it("should create and return default settings when none exist", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
        mockedAsyncStorage.setItem.mockResolvedValueOnce();

        const result = await getSettings();

        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(DEFAULT_SETTINGS)
        );
        expect(result).toEqual(DEFAULT_SETTINGS);
      });

      it("should throw DataServiceError for invalid data", async () => {
        const invalidSettings = { invalid: "data" };

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(invalidSettings)
        );

        await expect(getSettings()).rejects.toThrow(DataServiceError);
      });
    });

    describe("updateSettings", () => {
      it("should update settings successfully", async () => {
        const currentSettings = { ...DEFAULT_SETTINGS };
        const updates = { isDarkMode: true };

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(currentSettings)
        );
        mockedAsyncStorage.setItem.mockResolvedValueOnce();

        const result = await updateSettings(updates);

        expect(result.isDarkMode).toBe(true);
        expect(result.updatedAt).toBeDefined();
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(result)
        );
      });
    });

    describe("resetSettings", () => {
      it("should reset settings to default", async () => {
        mockedAsyncStorage.setItem.mockResolvedValueOnce();

        const result = await resetSettings();

        expect(result.isDarkMode).toBe(DEFAULT_SETTINGS.isDarkMode);
        expect(result.isFirstLaunch).toBe(DEFAULT_SETTINGS.isFirstLaunch);
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });
    });
  });

  // ==========================================================================
  // CATEGORIES 테스트
  // ==========================================================================

  describe("Categories", () => {
    const mockCategory: Category = {
      id: "cat-1",
      name: "Test Category",
      color: "#FF0000",
      icon: "🔥",
      description: "Test description",
      sortOrder: 0,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    };

    describe("getCategories", () => {
      it("should return existing categories", async () => {
        const mockCategories = [mockCategory];

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockCategories)
        );

        const result = await getCategories();

        expect(result).toEqual(mockCategories);
      });

      it("should create default categories when none exist", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(null);
        mockedAsyncStorage.setItem.mockResolvedValueOnce();
        mockedUtils.generateId
          .mockReturnValueOnce("id-1")
          .mockReturnValueOnce("id-2")
          .mockReturnValueOnce("id-3")
          .mockReturnValueOnce("id-4")
          .mockReturnValueOnce("id-5");

        const result = await getCategories();

        expect(result).toHaveLength(5);
        expect(result[0].name).toBe("즐겨찾기");
        expect(mockedAsyncStorage.setItem).toHaveBeenCalled();
      });

      it("should sort categories by sortOrder", async () => {
        const unsortedCategories = [
          { ...mockCategory, id: "2", sortOrder: 2 },
          { ...mockCategory, id: "1", sortOrder: 1 },
          { ...mockCategory, id: "0", sortOrder: 0 },
        ];

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(unsortedCategories)
        );

        const result = await getCategories();

        expect(result[0].sortOrder).toBe(0);
        expect(result[1].sortOrder).toBe(1);
        expect(result[2].sortOrder).toBe(2);
      });
    });

    describe("getCategoryById", () => {
      it("should return category by ID", async () => {
        const mockCategories = [mockCategory];

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockCategories)
        );

        const result = await getCategoryById("cat-1");

        expect(result).toEqual(mockCategory);
      });

      it("should return null for non-existent category", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

        const result = await getCategoryById("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("addCategory", () => {
      it("should add new category", async () => {
        const existingCategories = [mockCategory];
        const newCategoryData = {
          name: "New Category",
          color: "#00FF00",
          icon: "🆕",
          description: "New category",
          sortOrder: 1,
        };

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(existingCategories)
        );
        mockedAsyncStorage.setItem.mockResolvedValueOnce();
        mockedUtils.generateId.mockReturnValueOnce("new-id");

        const result = await addCategory(newCategoryData);

        expect(result.id).toBe("new-id");
        expect(result.name).toBe(newCategoryData.name);
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });
    });

    describe("updateCategory", () => {
      it("should update existing category", async () => {
        const existingCategories = [mockCategory];
        const updates = { name: "Updated Name" };

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(existingCategories)
        );
        mockedAsyncStorage.setItem.mockResolvedValueOnce();

        const result = await updateCategory("cat-1", updates);

        expect(result.name).toBe("Updated Name");
        expect(result.updatedAt).toBeDefined();
      });

      it("should throw error for non-existent category", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

        await expect(
          updateCategory("non-existent", { name: "Updated" })
        ).rejects.toThrow(DataServiceError);
      });
    });

    describe("deleteCategory", () => {
      it("should delete category and move links to misc category", async () => {
        const categories = [
          mockCategory,
          { ...mockCategory, id: "misc", name: "기타" },
        ];
        const links = [
          {
            id: "link-1",
            categoryId: "cat-1",
            title: "Test Link",
            url: "https://test.com",
            isFavorite: false,
            tags: [],
            sortOrder: 0,
            accessCount: 0,
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-01-01T00:00:00.000Z",
          },
        ];

        // getCategories 호출들
        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(categories)) // deleteCategory에서 getCategories
          .mockResolvedValueOnce(JSON.stringify(links)) // getLinks
          .mockResolvedValueOnce(JSON.stringify(links)) // updateLink에서 getLinks
          .mockResolvedValueOnce(JSON.stringify(categories)); // 마지막 setStorageItem

        mockedAsyncStorage.setItem.mockResolvedValue();

        await deleteCategory("cat-1");

        expect(mockedAsyncStorage.setItem).toHaveBeenCalledTimes(2); // 링크 업데이트 + 카테고리 삭제
      });
    });
  });

  // ==========================================================================
  // LINKS 테스트
  // ==========================================================================

  describe("Links", () => {
    const mockLink: Link = {
      id: "link-1",
      url: "https://example.com",
      title: "Example Link",
      description: "Example description",
      thumbnailUrl: undefined,
      categoryId: "cat-1",
      isFavorite: false,
      tags: ["test"],
      notes: undefined,
      sortOrder: 0,
      lastAccessedAt: undefined,
      accessCount: 0,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-01T00:00:00.000Z",
    };

    describe("getLinks", () => {
      it("should return existing links", async () => {
        const mockLinks = [mockLink];

        // 이 테스트만 resetAllMocks로 초기화
        jest.resetAllMocks();
        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(mockLinks)
        );
        mockedAsyncStorage.setItem.mockResolvedValue();

        const result = await getLinks();

        expect(result).toEqual(mockLinks);
      });

      it("should return empty array when no links exist", async () => {
        mockedAsyncStorage.getItem.mockImplementation((key) => {
          if (key === STORAGE_KEYS.LINKS) {
            return Promise.resolve(null);
          }
          return Promise.resolve(null);
        });

        const result = await getLinks();

        expect(result).toEqual([]);
        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.LINKS,
          JSON.stringify([])
        );
      });
    });

    describe("getLinkById", () => {
      it("should return link by ID", async () => {
        const mockLinks = [mockLink];

        mockedAsyncStorage.getItem.mockImplementation((key) => {
          if (key === STORAGE_KEYS.LINKS) {
            return Promise.resolve(JSON.stringify(mockLinks));
          }
          return Promise.resolve(null);
        });

        const result = await getLinkById("link-1");

        expect(result).toEqual(mockLink);
      });

      it("should return null for non-existent link", async () => {
        mockedAsyncStorage.getItem.mockImplementation((key) => {
          if (key === STORAGE_KEYS.LINKS) {
            return Promise.resolve(JSON.stringify([]));
          }
          return Promise.resolve(null);
        });

        const result = await getLinkById("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("getLinksInCategory", () => {
      it("should return links in specific category", async () => {
        const mockLinks = [
          { ...mockLink, categoryId: "cat-1", sortOrder: 1 },
          { ...mockLink, id: "link-2", categoryId: "cat-2", sortOrder: 0 },
          { ...mockLink, id: "link-3", categoryId: "cat-1", sortOrder: 0 },
        ];

        mockedAsyncStorage.getItem.mockImplementation((key) => {
          if (key === STORAGE_KEYS.LINKS) {
            return Promise.resolve(JSON.stringify(mockLinks));
          }
          return Promise.resolve(null);
        });

        const result = await getLinksInCategory("cat-1");

        expect(result).toHaveLength(2);
        expect(result[0].sortOrder).toBe(0); // 정렬 확인
        expect(result[1].sortOrder).toBe(1);
      });
    });

    describe("addLink", () => {
      it("should add new link", async () => {
        const existingLinks = [mockLink];
        const newLinkData = {
          url: "https://new.com",
          title: "New Link",
          categoryId: "cat-1",
          isFavorite: false,
          tags: [],
          sortOrder: 1,
          accessCount: 0,
        };

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(existingLinks)
        );
        mockedAsyncStorage.setItem.mockResolvedValueOnce();
        mockedUtils.generateId.mockReturnValueOnce("new-link-id");

        const result = await addLink(newLinkData);

        expect(result.id).toBe("new-link-id");
        expect(result.url).toBe(newLinkData.url);
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });
    });

    describe("updateLink", () => {
      it("should update existing link", async () => {
        const existingLinks = [mockLink];
        const updates = { title: "Updated Title" };

        mockedAsyncStorage.getItem.mockResolvedValueOnce(
          JSON.stringify(existingLinks)
        );
        mockedAsyncStorage.setItem.mockResolvedValueOnce();

        const result = await updateLink("link-1", updates);

        expect(result.title).toBe("Updated Title");
        expect(result.updatedAt).toBeDefined();
      });

      it("should throw error for non-existent link", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

        await expect(
          updateLink("non-existent", { title: "Updated" })
        ).rejects.toThrow(DataServiceError);
      });
    });

    describe("deleteLink", () => {
      it("should delete existing link", async () => {
        const existingLinks = [mockLink];

        mockedAsyncStorage.getItem.mockImplementation((key) => {
          if (key === STORAGE_KEYS.LINKS) {
            return Promise.resolve(JSON.stringify(existingLinks));
          }
          return Promise.resolve(null);
        });

        await deleteLink("link-1");

        expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.LINKS,
          JSON.stringify([])
        );
      });

      it("should throw error for non-existent link", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

        await expect(deleteLink("non-existent")).rejects.toThrow(
          DataServiceError
        );
      });
    });

    describe("searchLinks", () => {
      const searchLinks1 = [
        {
          ...mockLink,
          id: "1",
          title: "JavaScript Tutorial",
          description: "Learn JS",
          categoryId: "cat-1",
          tags: ["js", "tutorial"],
          isFavorite: true,
        },
        {
          ...mockLink,
          id: "2",
          title: "React Guide",
          description: "React basics",
          categoryId: "cat-2",
          tags: ["react", "tutorial"],
          isFavorite: false,
        },
        {
          ...mockLink,
          id: "3",
          title: "CSS Tips",
          description: "Styling tips",
          categoryId: "cat-1",
          tags: ["css"],
          isFavorite: false,
        },
      ];

      beforeEach(() => {
        mockedAsyncStorage.getItem.mockImplementation((key) => {
          if (key === STORAGE_KEYS.LINKS) {
            return Promise.resolve(JSON.stringify(searchLinks1));
          }
          return Promise.resolve(null);
        });
      });

      it("should search by query in title", async () => {
        const result = await searchLinks({ query: "JavaScript" });

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("JavaScript Tutorial");
      });

      it("should search by query in description", async () => {
        const result = await searchLinks({ query: "React basics" });

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("React Guide");
      });

      it("should filter by category", async () => {
        const result = await searchLinks({ query: "", categoryId: "cat-1" });

        expect(result).toHaveLength(2);
        expect(result.every((link) => link.categoryId === "cat-1")).toBe(true);
      });

      it("should filter by favorite status", async () => {
        const result = await searchLinks({ query: "", isFavorite: true });

        expect(result).toHaveLength(1);
        expect(result[0].isFavorite).toBe(true);
      });

      it("should filter by tags", async () => {
        const result = await searchLinks({ query: "", tags: ["tutorial"] });

        expect(result).toHaveLength(2);
        expect(result.every((link) => link.tags.includes("tutorial"))).toBe(
          true
        );
      });

      it("should combine multiple filters", async () => {
        const result = await searchLinks({
          query: "tutorial",
          categoryId: "cat-1",
          isFavorite: true,
        });

        expect(result).toHaveLength(1);
        expect(result[0].title).toBe("JavaScript Tutorial");
      });
    });

    describe("sortLinks", () => {
      const linksToSort = [
        {
          ...mockLink,
          id: "1",
          title: "Z Link",
          createdAt: "2023-01-01T00:00:00.000Z",
          accessCount: 5,
        },
        {
          ...mockLink,
          id: "2",
          title: "A Link",
          createdAt: "2023-01-02T00:00:00.000Z",
          accessCount: 10,
        },
        {
          ...mockLink,
          id: "3",
          title: "M Link",
          createdAt: "2023-01-03T00:00:00.000Z",
          accessCount: 1,
        },
      ];

      it("should sort by title ascending", () => {
        const result = sortLinks(linksToSort, "title", "asc");

        expect(result[0].title).toBe("A Link");
        expect(result[1].title).toBe("M Link");
        expect(result[2].title).toBe("Z Link");
      });

      it("should sort by createdAt descending", () => {
        const result = sortLinks(linksToSort, "createdAt", "desc");

        expect(result[0].createdAt).toBe("2023-01-03T00:00:00.000Z");
        expect(result[1].createdAt).toBe("2023-01-02T00:00:00.000Z");
        expect(result[2].createdAt).toBe("2023-01-01T00:00:00.000Z");
      });

      it("should sort by accessCount descending", () => {
        const result = sortLinks(linksToSort, "accessCount", "desc");

        expect(result[0].accessCount).toBe(10);
        expect(result[1].accessCount).toBe(5);
        expect(result[2].accessCount).toBe(1);
      });
    });

    describe("recordLinkAccess", () => {
      it("should increment access count and update last accessed time", async () => {
        const existingLinks = [mockLink];

        mockedAsyncStorage.getItem
          .mockResolvedValueOnce(JSON.stringify(existingLinks)) // getLinkById
          .mockResolvedValueOnce(JSON.stringify(existingLinks)); // updateLink -> getLinks

        mockedAsyncStorage.setItem.mockResolvedValueOnce();

        const result = await recordLinkAccess("link-1");

        expect(result.accessCount).toBe(1);
        expect(result.lastAccessedAt).toBeDefined();
      });

      it("should throw error for non-existent link", async () => {
        mockedAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify([]));

        await expect(recordLinkAccess("non-existent")).rejects.toThrow(
          DataServiceError
        );
      });
    });
  });

  describe("DataServiceError", () => {
    it("should create error with correct properties", () => {
      const originalError = new Error("Original error");
      const dataServiceError = new DataServiceError(
        "Test error",
        "testOperation",
        "testEntity",
        "testId",
        originalError
      );

      expect(dataServiceError.name).toBe("DataServiceError");
      expect(dataServiceError.message).toBe("Test error");
      expect(dataServiceError.operation).toBe("testOperation");
      expect(dataServiceError.entityType).toBe("testEntity");
      expect(dataServiceError.entityId).toBe("testId");
      expect(dataServiceError.originalError).toBe(originalError);
    });
  });
});
