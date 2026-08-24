interface Instructions {
    cook_time_minutes: number;
    
    ingredients: {
        name: string;
        quantity: string;
    }[];
    
    name: string;
    
    servings: number;
    
    steps: {
        instruction: string;
        order: number;
        title: string;
    }[];

    tips: string[];
    warnings?: string[];
    tutorial_url?: string;
}   
